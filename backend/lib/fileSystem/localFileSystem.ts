import * as fs from 'fs';
import * as child_proc from 'child_process';
import * as util from 'util';
import * as utils from '../utils';
import * as path from 'path';

import { FileSystem, FileSystemType, IFileSystemConfig } from "./fileSystem";
import { FileStat, FileType } from '../common/file_types';
import { Readable } from 'stream';


function statToStat(fstat: fs.Stats, file: string): FileStat //{
{
    const ans = new FileStat();
    utils.assignTargetEnumProp(fstat, ans);
    ans["filename"] = file;
    if (fstat.isBlockDevice()) {
        ans["filetype"] = FileType.block;
    } else if (fstat.isDirectory()) {
        ans["filetype"] = FileType.dir;
    } else if (fstat.isFile()) {
        ans["filetype"] = FileType.reg;
    } else if (fstat.isCharacterDevice()) {
        ans["filetype"] = FileType.char;
    } else if (fstat.isSymbolicLink()) {
        ans["filetype"] = FileType.symbol;
    } else if (fstat.isFIFO()) {
        ans["filetype"] = FileType.fifo;
    } else if (fstat.isSocket()) {
        ans["filetype"] = FileType.socket;
    } else {
        ans["filetype"] = FileType.unknown;
    }
    return ans;
} //}

export interface ILocalFileSystemConfig extends IFileSystemConfig {
    srcPrefix?: string;
    dstPrefix?: string;
}

export class LocalFileSystem extends FileSystem {
    private srcPrefix: string;
    private dstPrefix: string;

    private resolvePath(p: string) {
        if (!p.startsWith(this.srcPrefix)) {
            throw new Error('bad path');
        }
        return path.join(this.dstPrefix, p.substring(this.srcPrefix.length));
    }

    private reverseResolve(p: string) {
        if (!p.startsWith(this.dstPrefix)) {
            throw new Error('bad path, unexpected');
        }
        return path.join(this.srcPrefix, p.substring(this.dstPrefix.length));
    }

    constructor(config: ILocalFileSystemConfig) {
        super();
        if(config.type != this.FSType) {
            throw new Error(`Bad filesystem constructor for ${config.type}`);
        }
        this.srcPrefix = config.srcPrefix || '/';
        this.dstPrefix = config.dstPrefix || '/';
    }

    get FSType(): FileSystemType {return FileSystemType.local;}

    async chmod(file: string, mode: number) {
        file = this.resolvePath(file);
        await fs.promises.chmod(file, mode.toString(8));
    }

    async copy(src: string, dst: string) {
        src = this.resolvePath(src);
        dst = this.resolvePath(dst);
        await fs.promises.copyFile(src, dst);
    }

    async execFile(file: string, argv: string[]): Promise<string> {
        file = this.resolvePath(file);
        return await new Promise((resolve, reject) => {
            child_proc.execFile(file, argv, (err, stdout, stderr) => {
                if(err) return reject(err);
                if(stderr && (!stdout || stdout.length == 0)) return reject(stderr);
                resolve(stdout);
            });
        });
    }

    async getdir(dir: string): Promise<FileStat[]> {
        dir = this.resolvePath(dir);
        const files = await fs.promises.readdir(dir);
        const ans = [];
        let haserror = false;
        for(let f of files) {
            const g = path.join(dir, f);
            try {
                const stat = statToStat(await fs.promises.stat(g), g);
                stat.filename = this.reverseResolve(stat.filename);
                ans.push(stat);
            } catch (err) {
                haserror = true;
            }
        }
        if(ans.length == 0 && haserror) {
            throw new Error('readdir fail');
        }
        return ans;
    }
    
    async mkdir(dir: string) {
        dir = this.resolvePath(dir);
        await fs.promises.mkdir(dir, {recursive: true});
    }

    async move(src: string, dst: string) {
        src = this.resolvePath(src);
        dst = this.resolvePath(dst);
        await fs.promises.rename(src, dst);
    }

    static asyncRead = util.promisify(fs.read);
    async read(file: string, position: number, length: number): Promise<Buffer> {
        file = this.resolvePath(file);
        const fd = await fs.promises.open(file, "r");
        let buf = Buffer.alloc(length);
        const nb = (await LocalFileSystem.asyncRead(fd.fd, buf, 0, length, position)).bytesRead;
        await fd.close();
        return Buffer.from(buf, 0, nb);
    }

    async remove(path: string) {
        path = this.resolvePath(path);
        await fs.promises.unlink(path);
    }

    async rmdir(path: string) {
        path = this.resolvePath(path);
        await fs.promises.rmdir(path);
    }

    async remover(path: string) {
        const stat = await this.stat(path);
        if (stat.filetype == FileType.dir) {
            path = this.resolvePath(path);
            await fs.promises.rmdir(path, {recursive: true});
        } else {
            await this.remove(path);
        }
    }

    async stat(file: string): Promise<FileStat> {
        file = this.resolvePath(file);
        const fstat = await fs.promises.stat(file)
        const stat = statToStat(fstat, file);
        stat.filename = this.reverseResolve(stat.filename);
        return stat;
    }

    async touch(path: string) {
        path = this.resolvePath(path);
        let cur = new Date();
        let f = null;
        try {
            f = await fs.promises.stat(path);
        } catch {}
        if(!!f) {
            await fs.promises.utimes(path, cur, cur);
        } else {
            await (await fs.promises.open(path, 'w')).close();
        }
    }

    async truncate(file: string, len: number) {
        file = this.resolvePath(file);
        await fs.promises.truncate(file, len);
    }

    async append(file: string, buf: ArrayBuffer): Promise<void> {
        file = this.resolvePath(file);
        await fs.promises.appendFile(file, Buffer.from(buf));
    }

    static asyncWrite = util.promisify(fs.write);
    async write(file: string, position: number, buf: ArrayBuffer): Promise<number> {
        file = this.resolvePath(file);
        try {
        const fd = await fs.promises.open(file, "r+");
        const rs = await LocalFileSystem.asyncWrite(fd.fd, new Uint8Array(buf), 0, buf.byteLength, position);
        await fd.close();
        return rs.bytesWritten;
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    async createReadableStream(filename: string, position: number, length: number): Promise<Readable> //{
    {
        filename = this.resolvePath(filename);
        const options = {
            flags: 'r',
            start: position
        };
        if(length >= 0) {
            options['end'] = position + length;
        }
        return fs.createReadStream(filename, options);
    } //}

    async createNewFileWithReadableStream(filename: string, reader: Readable): Promise<number> //{
    {
        filename = this.resolvePath(filename);
        const ws = fs.createWriteStream(filename, {flags: 'w'});
        const ans = await utils.pipelineWithTimeout(reader, ws);
        return ans;
    } //}
}

