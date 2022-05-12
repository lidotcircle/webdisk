import { FileStat, FileType, StorageType } from '../common/file_types';
import { Readable } from 'stream';
import { FileSystem, FileSystemType, IFileSystemConfig } from './fileSystem';
import { prototype as ossprototype, HTTPMethods, ObjectMeta} from 'ali-oss';
import { constants } from '../constants';
import assert from 'assert';
import path from 'path';
import alioss from 'ali-oss';
import { warn } from '../../service';
type OSS = typeof ossprototype;
class AliOSSFileSystemNotImplemented extends Error {}

enum OSSObjectType {
    Normal = 'Normal',           // Normal Object can't be appended
    Appendable = 'Appendable'    // Appendable object can't be copied
}
class AliOSSFileStat extends FileStat {
    etag: string;
    objectType: OSSObjectType;
}

export interface IAliOSSFileSystemConfig extends IFileSystemConfig {
    data: {
        accessKeyId: string;
        accessKeySecret: string;
        region: string;
        bucket: string;
        secure?: boolean;
    };
}

export class AliOSSFileSystem extends FileSystem {
    private bucket: OSS;
    private config: IAliOSSFileSystemConfig;

    get FSType(): FileSystemType {return FileSystemType.alioss;}

    constructor(config: IAliOSSFileSystemConfig) {
        super();
        this.bucket = new alioss(config.data);
        this.config = config;
        this.initAliOSS();
    }

    private resolveFilenameToObjectName(filename: string): string {
        assert.equal(filename.startsWith('/'), true, `bad filename ${filename}`);
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
        ans.storageType = StorageType.alioss;
        ans.objectType = metaData.type as OSSObjectType;

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
        ans.storageType = StorageType.alioss;
        ans.filename = this.resolveObjectNameToFilename(prefix);
        ans.filetype = FileType.dir;
        ans.mtimeMs = Date.now(); 
        ans.ctimeMs = ans.mtimeMs;
        ans.atimeMs = ans.mtimeMs;
        return ans;
    }

    private async getObjectSignatureUrl(objectName: string, method: HTTPMethods = 'GET', expires: number = 3600) {
        const filename = this.resolveObjectNameToFilename(objectName);
        const content_type = constants.FILE_TYPE_MAP.get(path.extname(filename)) || 
                                                         constants.FILE_TYPE_MAP.get('unknown');
        const response_header = {
            'Content-Type': content_type
        };
        return await this.bucket.signatureUrl(objectName, {expires: 3600, method: method, response: response_header as any});
    }

    async initAliOSS() {
        // check
        try {
            await this.bucket.list({prefix: "", delimiter: '/', "max-keys": 1}, {timeout: 5000});

            await this.bucket.putBucketCORS(this.config.data.bucket, [
                {
                    allowedOrigin: '*',
                    allowedMethod: ['GET', 'PUT']
                }
            ]);
        } catch (e) {
            warn(e);
        }
    }

    async chmod(file: string, mode: number) {
        throw new AliOSSFileSystemNotImplemented();
    }

    async copy(src: string, dst: string) //{
    {
        if(dst.endsWith('/')) {
            throw new Error('Bad Entry');
        }
        const src_stat = await this.stat(src);
        if(src_stat.objectType == OSSObjectType.Appendable) {
            const srcstream = await this.createReadableStream(src, 0, src_stat.size);
            await this.createNewFileWithReadableStream(dst, srcstream);
        } else {
            await this.bucket.copy(this.resolveFilenameToObjectName(dst), 
                                   this.resolveFilenameToObjectName(src), {timeout: 5000});
        }
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
        throw new AliOSSFileSystemNotImplemented();
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

        let s;
        try {
            s = await this.stat(dst);
        } catch {}
        if(s) {
            throw new Error('File Already Exist');
        }

        await this.copy(src, dst);
        await this.remove(src);
    } //}
    async move(src: string, dst: string) //{
    {
        const st = await this.stat(src);
        if(st.filetype == FileType.reg) {
            await this.movefile(src, dst);
            return;
        }

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
                for(const obj of resp.objects) {
                    if(obj.name.endsWith('/')) {
                        await this.bucket.delete(obj.name, {timeout: 5000});
                    } else {
                        const d = dst_prefix + obj.name.substr(src_prefix.length);
                        await this.movefile(this.resolveObjectNameToFilename(obj.name), 
                                            this.resolveObjectNameToFilename(d));
                    }
                }
            }
        }
    } //}

    async read(file: string, position: number, length: number): Promise<Buffer> //{
    {
        if(length==0) {
            const st = await this.stat(file);
            assert.equal(st.size >= position, true);
            return Buffer.alloc(0);
        }
        const objname = this.resolveFilenameToObjectName(file);
        const resp = await this.bucket.get(objname, null, {
            headers: {
                'Range': `bytes=${position}-${position+length-1}`
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
    private async removeAnEntry(path: string) //{
    {
        const versions = await this.versions(path);
        for(const ver of versions) {
            await this.bucket.delete(this.resolveFilenameToObjectName(path), 
                {timeout: 5000, versionId: ver.versionId} as any);
        }
    } //}
    async remove(path: string)//{
    {
        const st = await this.stat(path);
        if(st.filetype == FileType.dir) {
            throw new Error('bad operation in directory: remove');
        } else {
            this.removeAnEntry(path);
        }
    } //}
    async rmdir(path: string) //{
    {
        const st = await this.stat(path);
        if(st.filetype != FileType.dir) {
            throw new Error('bad operation in file: rmdir');
        } else {
            this.removeAnEntry(path);
        }
    } //}

    /*
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
    */

    async stat(file: string): Promise<AliOSSFileStat> //{
    {
        if(file == '/') {
            return this.prefixToFileStat('');
        }
        let ans: AliOSSFileStat;

        const prefix = this.resolveFilenameToObjectName(file);

        { // Directory
            const resp = await this.bucket.list({prefix: prefix + (prefix.endsWith('/') ? '' : '/'), 'max-keys': 1}, {timeout: 3000});
            if(resp.objects || resp.prefixes) {
                ans = this.prefixToFileStat(prefix);
            }
        }

        { // File
            if(ans == null && !file.endsWith('/')) {
                const resp = await this.bucket.list({prefix: prefix, 'max-keys': 1}, {timeout: 3000});
                if (resp.objects && 
                    resp.objects.length > 0 && 
                    resp.objects[0].name == prefix) 
                {
                    ans = this.metadataToFileStat(resp.objects[0]);
                }
            }
        }

        if(ans == null) {
            throw new Error('File Not Found');
        }
        return ans;
    } //}

    async touch(file: string) //{
    {
        try {
            const fstat = await this.stat(file);
            throw new AliOSSFileSystemNotImplemented();
        } catch {
            await this.bucket.put(this.resolveFilenameToObjectName(file), Buffer.alloc(0));
        }
    } //}

    async truncate(file: string, len: number) {
        throw new AliOSSFileSystemNotImplemented();
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
        throw new AliOSSFileSystemNotImplemented();
    }

    async createReadableStream(filename: string, position: number, length: number): Promise<Readable> //{
    {
        const objname = this.resolveFilenameToObjectName(filename);
        return (await this.bucket.getStream(objname, {
            headers: {
                'Range': `bytes=${position}-${position+length-1}`
            }
        })).stream;
    } //}

    async createNewFileWithReadableStream(filename: string, reader: Readable): Promise<number> //{
    {
        const objname = this.resolveFilenameToObjectName(filename);
        const resp = await this.bucket.put(objname, reader);
        return resp.res.size;
    } //}

    async canRedirect(filename: string): Promise<boolean> //{
    {
        return true;
    } //}

    async redirect(filename: string): Promise<string[]> //{
    {
        return [await this.getObjectSignatureUrl(this.resolveFilenameToObjectName(filename), 'GET')];
    } //}
}

