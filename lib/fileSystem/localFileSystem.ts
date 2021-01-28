import * as fs from 'fs';
import * as annautils from 'annautils';
import * as child_proc from 'child_process';
import * as util from 'util';
import * as utils from '../utils';
import * as crypto from 'crypto';
import * as path from 'path';

import { FileSystem } from "./fileSystem";
import { FileStat, FileType } from '../common/file_types';
import { pipeline, Writable } from 'stream';


function statToStat(fstat: fs.Stats, file: string): FileStat {
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
}


export class LocalFileSystem extends FileSystem {
    constructor() {super();}

    async chmod(file: string, mode: number) {
        await fs.promises.chmod(file, mode.toString(8));
    }

    async copy(src: string, dst: string) {
        await fs.promises.copyFile(src, dst);
    }

    async copyr(src: string, dst: string) {
        await annautils.fs.promisify.copyr(src, dst);
    }

    async execFile(file: string, argv: string[]): Promise<string> {
        return await new Promise((resolve, reject) => {
            child_proc.execFile(file, argv, (err, stdout, stderr) => {
                if(err) return reject(err);
                if(stderr && (!stdout || stdout.length == 0)) return reject(stderr);
                resolve(stdout);
            });
        });
    }

    async getdir(dir: string): Promise<FileStat[]> {
        const files = await fs.promises.readdir(dir);
        const ans = [];
        let haserror = false;
        for(let f of files) {
            const g = path.join(dir, f);
            try {
                ans.push(statToStat(await fs.promises.stat(g), g));
            } catch (err) {
                haserror = true;
            }
        }
        if(ans.length == 0 && haserror) {
            throw new Error('readdir fail');
        }
        return ans;
    }
    
    /*
    async fileSliceMD5(file: string, position: number, len: number): Promise<string> {
        const md5Digest = crypto.createHash("md5");
        const fd = await fs.promises.open(file, "r");
        const buf = Buffer.alloc(1024 * 1024);
        let o = 0;
        while (len > 0) {
            const n = Math.min(len, buf.byteLength);
            const nb = (await LocalFileSystem.asyncRead(fd.fd,buf,0,n,position+o)).bytesRead;
            if (nb < n) {
                md5Digest.update(Buffer.from(buf,0,nb));
                // TODO or omit
                throw new Error("file out of range");
            } else {
                if(nb == buf.byteLength) {
                    md5Digest.update(buf);
                } else {
                    let b2 = Buffer.alloc(nb);
                    buf.copy(b2,0,0,nb);
                    md5Digest.update(b2);
                }
            }
            len -= n;
            o += n;
        }
        await fd.close();
        return md5Digest.digest("hex");
    }
    */

    async mkdir(dir: string) {
        await fs.promises.mkdir(dir, {recursive: true});
    }

    async move(src: string, dst: string) {
        await fs.promises.rename(src, dst);
    }

    static asyncRead = util.promisify(fs.read);
    async read(file: string, position: number, length: number): Promise<Buffer> {
        const fd = await fs.promises.open(file, "r");
        let buf = Buffer.alloc(length);
        const nb = (await LocalFileSystem.asyncRead(fd.fd, buf, 0, length, position)).bytesRead;
        await fd.close();
        return Buffer.from(buf, 0, nb);
    }

    async remove(path: string) {
        const stat = await fs.promises.stat(path);
        if(stat.isDirectory()) {
            await fs.promises.rmdir(path);
        } else {
            await fs.promises.unlink(path);
        }
    }

    async remover(path: string) {
        await annautils.fs.promisify.removeRecusive(path);
    }

    async stat(file: string): Promise<FileStat> {
        const fstat = await fs.promises.stat(file)
        return statToStat(fstat, file);
    }

    async touch(path: string) {
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
        await fs.promises.truncate(file, len);
    }

    async append(file: string, buf: ArrayBuffer): Promise<void> {
        await fs.promises.appendFile(file, Buffer.from(buf));
    }

    static asyncWrite = util.promisify(fs.write);
    async write(file: string, position: number, buf: ArrayBuffer): Promise<number> {
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

    async writeFileToWritable(filename: string, //{
                              writer: Writable, 
                              startPosition: number,
                              length: number = -1): Promise<number> 
    {
        const options = {
            flags: 'r',
            start: startPosition
        };
        if(length >= 0) {
            options['end'] = startPosition + length;
        }
        const fstream = fs.createReadStream(filename, options);

        try {
            /* block when other endpoint closed connection, expect throw error
            await util.promisify(pipeline)(fstream, writer);
            return 0;
            */
             return await utils.pipelineWithTimeout(fstream, writer, 5000);
        } finally {
            fstream.close();
        }
    } //}
}

