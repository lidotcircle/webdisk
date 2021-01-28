import { FileStat, FileType } from '../common/file_types';
import { pipeline, Readable, Writable } from 'stream';
import { FileSystem } from './fileSystem';
import { prototype as ossprototype, ListBucketsQueryType, Bucket, HTTPMethods, ObjectMeta} from 'ali-oss';
import { default as fetch } from 'node-fetch';
import { pipelineWithTimeout } from '../utils';

const alioss = require('ali-oss');
type OSS = typeof ossprototype;
class FileSystemNotImplemented extends Error {}

class AliOSSFileStat extends FileStat {
    etag: string;
    objectType: string;
}

export class AliOSSFileSystem extends FileSystem {
    private bucket: OSS;

    constructor(data: {
        accessKeyId: string,
        accessKeySecret: string,
        region?: string,
        bucket?: string
    }) {
        super();
        this.bucket = new alioss(data);
        this.initAliOSS();
    }

    private resolveFilenameToObjectName(filename: string): string {
        console.assert(filename.startsWith('/'), `bad filename ${filename}`);
        return filename.substr(1);
    }
    private resolveObjectNameToFilename(objectName: string): string {
        return '/' + objectName;
    }

    private async getObjectMetadata(objectName: string): Promise<ObjectMeta> {
        const list = await this.bucket.list({prefix: objectName, "max-keys": 1}, {timeout: 5000});
        if(!list.objects || list.objects.length == 0) {
            throw new Error('Not Found');
        }
        return list.objects[0];
    }

    private metadataToFileStat(metaData: ObjectMeta): AliOSSFileStat {
        const ans = new AliOSSFileStat();
        ans.size = metaData.size;
        ans.filename = this.resolveObjectNameToFilename(metaData.name);
        ans.filetype = FileType.reg;
        ans.mode = 623;
        ans.etag = metaData.etag;
        ans.objectType = metaData.type;

        const time = new Date(metaData.lastModified).getTime(); 
        ans.mtimeMs = time;
        ans.ctimeMs = time;
        ans.atimeMs = Date.now();
        return ans;
    }

    private prefixToFileStat(prefix: string): AliOSSFileStat {
        const ans = new AliOSSFileStat();
        ans.size = 4 * 4096;
        ans.mode = 6123;
        ans.filename = this.resolveObjectNameToFilename(prefix);
        ans.filetype = FileType.dir;
        ans.mtimeMs = Date.now(); 
        ans.ctimeMs = ans.mtimeMs;
        ans.atimeMs = ans.mtimeMs;
        return ans;
    }

    private async getObjectSignatureUrl(objectName: string, method: HTTPMethods = 'GET', expires: number = 3600) {
        return await this.bucket.signatureUrl(objectName, {expires: 3600, method: method});
    }

    async initAliOSS() {
        // check
        await this.bucket.list({prefix: "", delimiter: '/', "max-keys": 1}, {timeout: 5000});
    }

    async chmod(file: string, mode: number) {
        throw new FileSystemNotImplemented();
    }

    async copy(src: string, dst: string) //{
    {
        if(dst.endsWith('/')) {
            throw new Error('Bad Entry');
        }
        await this.bucket.copy(this.resolveFilenameToObjectName(dst), this.resolveFilenameToObjectName(src), {timeout: 5000});
    } //}

    async copyr(src: string, dst: string) //{
    {
        try {
            await this.copy(src, dst);
            return;
        } catch {}

        if(!src.endsWith('/')) src += '/';
        if(!dst.endsWith('/')) dst += '/';
        const src_prefix = this.resolveFilenameToObjectName(src);
        const dst_prefix = this.resolveFilenameToObjectName(dst);
        let cont: boolean = true;
        let query = {prefix: src_prefix, 'max-keys': 1000};
        while(cont) {
            const resp = await this.bucket.list(query, {timeout: 5000});
            cont = resp.isTruncated;
            query['marker'] = resp.nextMarker;
            if(resp.objects && resp.objects.length > 0) {
                for(const obj of resp.objects) {
                    if(obj.name.endsWith('/'))
                        continue;
                    const dst_objname = dst_prefix + obj.name.substr(src_prefix.length);
                    await this.copy(this.resolveObjectNameToFilename(obj.name),
                                    this.resolveObjectNameToFilename(dst_objname));
                }
            }
        }
    } //}

    async execFile(file: string, argv: string[]): Promise<string> {
        throw new FileSystemNotImplemented();
    }

    async getdir(dir: string): Promise<FileStat[]> //{
    {
        if(!dir.endsWith('/')) dir += '/';
        const ans: FileStat[] = [];
        const dir_prefix = this.resolveFilenameToObjectName(dir);
        let cont: boolean = true;

        while(cont) {
            const query = {prefix: dir_prefix, delimiter: '/', "max-keys": 1000};
            const resp = await this.bucket.list(query, {timeout: 3000});
            cont = !!resp.isTruncated;
            query['marker'] = resp.nextMarker;

            if(resp.prefixes) {
                resp.prefixes.forEach(prefix => {
                    if(prefix == dir_prefix) return;
                    ans.push(this.prefixToFileStat(prefix))
                });
            }
            if(resp.objects) {
                resp.objects.forEach(obj => {
                    if(obj.name == dir_prefix) return;

                    if(obj.name.endsWith('/')) {
                        ans.push(this.prefixToFileStat(obj.name));
                    } else {
                        ans.push(this.metadataToFileStat(obj));
                    }
                });
            }
        }

        // TODO sort
        return ans;
    } //}

    async mkdir(dir: string) //{
    {
        if(!dir.endsWith('/')) dir += '/';
        await this.bucket.put(this.resolveFilenameToObjectName(dir), Buffer.alloc(0));
    } //}

    private async movefile(src: string, dst: string) //{
    {
        if(src.endsWith('/') || dst.endsWith('/')) {
            throw new Error('Bad Entry');
        }

        try {
            const s = await this.stat(dst);
            throw new Error('File Already Exist');
        } catch {}

        await this.copy(src, dst);
        await this.remove(src);
    } //}

    async move(src: string, dst: string) //{
    {
        try {
            await this.movefile(src, dst);
            return;
        } catch {}

        if(!src.endsWith('/')) src += '/';
        if(!dst.endsWith('/')) dst += '/';
        const src_prefix = this.resolveFilenameToObjectName(src);
        const dst_prefix = this.resolveFilenameToObjectName(dst);

        let cont = true;
        const query = {prefix: src_prefix, 'max-keys': 1000};
        while(cont) {
            const resp = await this.bucket.list(query, {timeout: 5000});
            cont = resp.isTruncated;
            query['marker'] = resp.nextMarker;

            if(resp.objects) {
                resp.objects.forEach(async obj => {
                    if(obj.name.endsWith('/')) {
                        await this.bucket.delete(obj.name, {timeout: 5000});
                    } else {
                        const d = dst_prefix + obj.name.substr(src_prefix.length);
                        await this.movefile(obj.name, d);
                    }
                });
            }
        }
    } //}

    async read(file: string, position: number, length: number): Promise<Buffer> //{
    {
        const objname = this.resolveFilenameToObjectName(file);
        const resp = await this.bucket.get(objname, null, {
            headers: {
                'Range': `bytes=${position}-${position+length}`
            }
        });
        return resp.content;
    } //}

    private async versions(file: string): Promise<{versionId: string, lastModified: string}[]> //{
    {
        const ans = [];
        const objname = this.resolveFilenameToObjectName(file);
        const query = {prefix: objname, 'max-keys': 20};
        let cont = true;

        const add = v => {
            if(v.name != objname) {
                cont = false;
                return;
            } else {
                ans.push({versionId: v.versionId, lastModified: v.lastModified});
            }
        }
        while(cont) {
            const resp = await (this.bucket as any).getBucketVersions(query);
            cont = resp.isTruncated;
            query['keyMarker'] = resp.nextKeyMarker;
            query['versionIdMarker'] = resp.nextVersionIdMarker;
            if(resp.objects) {
                resp.objects.forEach(add);
            }

            if(resp.deleteMarker) {
                resp.deleteMarker.forEach(add);
            }
        }

        return ans;
    } //}
    async remove(path: string) //{
    {
        const versions = await this.versions(path);
        for(const ver of versions) {
            await this.bucket.delete(this.resolveFilenameToObjectName(path), 
                {timeout: 5000, versionId: ver.versionId} as any);
        }
    } //}

    async remover(path: string) //{
    {
        try {
            await this.remove(path);
            return;
        } catch {}
        if(!path.endsWith('/')) path += '/';
        const path_prefix = this.resolveFilenameToObjectName(path);
        try {
            await this.bucket.delete(path_prefix, {timeout: 5000});
        } catch{}

        const query = {prefix: path_prefix, 'max-keys': 1000};
        let cont = true;
        while(cont) {
            const resp = await this.bucket.list(query, {timeout: 5000});
            cont = resp.isTruncated;
            query['marker'] = resp.nextMarker;
            if(resp.objects) {
                resp.objects.forEach(async obj => await this.bucket.delete(obj.name, {timeout: 5000}));
            }
        }
    } //}

    async stat(file: string): Promise<AliOSSFileStat> //{
    {
        if(file == '/') {
            return this.prefixToFileStat('');
        }
        let ans: AliOSSFileStat;

        if(file.endsWith('/')) file = file.substr(0, file.length - 1);
        const prefix = this.resolveFilenameToObjectName(file);
        const resp = await this.bucket.list({prefix: prefix, 'max-keys': 1, delimiter: '/'}, {timeout: 3000});
        if(resp.objects && resp.objects.length > 0) {
            if(resp.objects[0].name == prefix) {
                ans = this.metadataToFileStat(resp.objects[0]);
            } else {
                throw new Error('File Not Found');
            }
        } else if(resp.prefixes && resp.prefixes.length > 0) {
            if(resp.prefixes[0] == prefix + '/') {
                ans = this.prefixToFileStat(resp.prefixes[0]);
            } else {
                throw new Error('File Not Found');
            }
        } else {
            throw new Error('File Not Found');
        }
        return ans;
    } //}

    async touch(file: string) //{
    {
        try {
            const fstat = await this.stat(file);
            throw new FileSystemNotImplemented();
        } catch {
            await this.bucket.put(this.resolveFilenameToObjectName(file), Buffer.alloc(0));
        }
    } //}

    async truncate(file: string, len: number) {
        throw new FileSystemNotImplemented();
    }

    async append(file: string, buf: ArrayBuffer): Promise<void> //{
    {
        const objname = this.resolveFilenameToObjectName(file);
        let req = null;
        try {
            const fstat = await this.stat(file);
            req = {position: fstat.size};
        } catch {}
        await this.bucket.append(objname, Buffer.from(buf), req);
    } //}

    async write(file: string, position: number, buf: ArrayBuffer): Promise<number> {
        throw new FileSystemNotImplemented();
    }

    async writeFileToWritable(filename: string, //{
                              writer: Writable, 
                              startPosition: number,
                              length: number = -1): Promise<number> 
    {
        if(length < 0) {
            const stat = await this.stat(filename);
            length = stat.size - startPosition;
            if(length < 0) {
                throw new Error('request too large');
            }
        }
        const objname = this.resolveFilenameToObjectName(filename);
        const stream = await this.bucket.getStream(objname, {
            headers: {
                'Range': `bytes=${startPosition}-${startPosition+length}`
            }
        });
        return await pipelineWithTimeout((stream.stream as Readable), writer, 5000);
    } //}
}

