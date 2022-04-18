import * as crypto from 'crypto';
import * as utils from '../utils';

import { FileStat, FileType } from "../common/file_types";
import { Readable, Writable } from 'stream';
import path from 'path';
import { SimpleExpiredStoreService } from '../../service/simple-expired-store-service';
import { DIProperty } from '../../lib/di';
import { v4 as uuidv4 } from "uuid";
import { filter, map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

class FileSystemNotImplemented extends Error {
    constructor() {
        super('File System API Not Implemented');
    }
}

export enum FileSystemType { local = 'local', alioss = 'alioss', multi = 'multi' }
export interface IFileSystemConfig {
    type: FileSystemType;
    data?: any;
}

export class FileSystem {
    constructor() {}

    get FSType(): FileSystemType {
        throw new FileSystemNotImplemented();
    }

    async chmod(_file: string, _mode: number) {
        throw new FileSystemNotImplemented();
    }

    /**
     * @param {string} src full path of src file 
     * @param {string} dst full path of dst file, overwrite origin file if exists
     */
    async copy(src: string, dst: string) //{
    {
        const ss = await this.stat(src);
        if (ss.filetype != FileType.reg) {
            throw new Error("expect a regular file");
        }
        const rs = await this.createReadableStream(src, 0, ss.size);
        await this.createNewFileWithReadableStream(dst, rs);
    } //}

    /**
     * @param {string} src src can be a directory or a file
     * @param {string} dst if dst exists dst should be a directory, otherwise dst will be create
     */
    async copyr(src: string, dst: string) //{
    {
        const ss = await this.stat(src);

        if(ss.filetype == FileType.dir) {
            try {
                await this.stat(dst);
            } catch {
                await this.mkdir(dst);
            }
            const subdirs = await this.getdir(src);
            for(const file of subdirs) {
                if(file.filetype == FileType.dir) {
                    await this.copyr(file.filename, path.join(dst, file.basename));
                } else {
                    await this.copy(file.filename, path.join(dst, file.basename));
                }
            }
        } else {
            this.copy(src, dst);
        }
    } //}

    async execFile(_file: string, _argv: string[]): Promise<string> {
        throw new FileSystemNotImplemented();
    }

    /**
     * @param {string} _dir should be a directory
     */
    async getdir(_dir: string): Promise<FileStat[]> {
        throw new FileSystemNotImplemented();
    }

    /**
     * @param {string} file should be a file path
     */
    async fileMD5(file: string): Promise<string> {
        const stat = await this.stat(file);
        return await this.fileSliceMD5(file, 0, stat.size);
    }

    async fileSliceMD5(file: string, position: number, len: number): Promise<string> {
        const md5Digest = crypto.createHash("md5");
        const buf = await this.read(file,position,len);
        md5Digest.update(buf);
        return md5Digest.digest('hex');
    }

    /**
     * @param {string} dir possible exist
     */
    async mkdirForce(dir: string) {
        try {
            const dirstat = await this.stat(dir);
            if (dirstat.filetype == FileType.dir)
                return;
        } catch {}

        await this.mkdir(dir);
    }

    /**
     * @param {string} _dir shouldn't exist
     */
    async mkdir(_dir: string) {
        throw new FileSystemNotImplemented();
    }

    /**
     * @param {string} _dir should exist
     */
    async rmdir(_dir: string) {
        throw new FileSystemNotImplemented();
    }

    /**
     * @param {string} src should exist
     * @param {string} dst shouldn't exist
     */
    async move(src: string, dst: string) //{
    {
        await this.copyr(src, dst);
        await this.remover(src);
    } //}

    async read(_file: string, _position: number, _length: number): Promise<Buffer> {
        throw new FileSystemNotImplemented();
    }

    /**
     * @param {string} _path should be full path of a file
     */
    async remove(_path: string) {
        throw new FileSystemNotImplemented();
    }

    /**
     * @param {string} path can be both full path of a file or directory
     */
    async remover(path: string) //{
    {
        const stat = await this.stat(path);

        if(stat.filetype == FileType.dir) {
            const files = await this.getdir(path);
            const prom: Promise<void>[] = [];
            for(const subfile of files) {
                if(subfile.filetype == FileType.dir) {
                    prom.push(this.remover(subfile.filename));
                } else {
                    prom.push(this.remove(subfile.filename));
                }
            }
            await Promise.all(prom);
            await this.rmdir(path);
        } else {
            await this.remove(path);
        }
    } //}

    /**
     * @param {string} _file should exist
     */
    async stat(_file: string): Promise<FileStat> {
        throw new FileSystemNotImplemented();
    }

    /**
     * @param {string} _file valid path
     */
    async touch(_file: string) {
        throw new FileSystemNotImplemented();
    }

    async truncate(_file: string, _len: number) {
        throw new FileSystemNotImplemented();
    }

    async append(_file: string, _buf: ArrayBuffer): Promise<void> {
        throw new FileSystemNotImplemented();
    }

    @DIProperty(SimpleExpiredStoreService)
    private kvstore: SimpleExpiredStoreService;
    private uploadedTimeout: number = 1 * 60 * 1000;
    // TODO waiters threshold
    private maxUploadWaiter: number = 20;

    async createUploadSession(file: string, startpos: number): Promise<string> {
        if (startpos < 0 || !Number.isInteger(startpos)) {
            throw new Error("bad startpos, should be a non-negative integer");
        }

        const uuid = uuidv4();
        this.kvstore.setval(uuid, { filename: file, startpos: startpos, uploadedBytes: startpos, waiters: 0 }, this.uploadedTimeout);
        await this.touch(file);
        const fstat = await this.stat(file);
        if (fstat.filetype != FileType.reg) {
            throw new Error(`can't upload file to '${file}'`);
        } else if (fstat.size != startpos) {
            throw new Error(`bad startpos, currently the size of '${file}' is ${fstat.size}`);
        }
        return uuid;
    }

    async uploadSlice(uploadSessionId: string, pos: number, buf: ArrayBuffer): Promise<void> {
        const info = this.kvstore.getval(uploadSessionId) as any;
        if (!info) {
            throw new Error("session expired or didn't exist");
        }
        const filename = info.filename;
        const startpos = info.startpos;
        let uploadedBytes = info.uploadedBytes;
        if (pos < uploadedBytes) {
            throw new Error("slice already writed");
        } else {
            if (pos > uploadedBytes) {
                const no_waiters: number = info.waiters + 1;
                if (no_waiters > this.maxUploadWaiter) {
                    throw new Error(`too many waiters: ${this.maxUploadWaiter + 1}`);
                }

                info.waiters = no_waiters;
                info.lowest_bytes = info.lowest_bytes || pos;
                let msgtype = '';
                const enheng = await firstValueFrom(this.kvstore.onChange(uploadSessionId)
                    .pipe(filter(msg => {
                        if (msg.etype != 'set') return true;
                        if (msg.value.uploadedBytes >= pos) return true;
                    }))
                    .pipe(map(msg => (msgtype = msg.etype) == 'set' && (uploadedBytes = msg.value.uploadedBytes) == pos)));
                info.waiters = info.waiters - 1;

                if (!enheng) {
                    throw new Error(`${msgtype}...`);
                }
            }

            try {
                await this.append(filename, buf);
                info.uploadedBytes = uploadedBytes + buf.byteLength;
                this.kvstore.setval(uploadSessionId, info, this.uploadedTimeout);
            } catch (e) {
                if (pos == startpos) {
                    this.kvstore.clear(uploadSessionId);
                }
                throw e;
            }
        }
    }

    async expireUploadSession(uploadSessionId: string): Promise<void> {
        const info = this.kvstore.getval<any>(uploadSessionId);
        if (!info) {
            throw new Error("upload session expired or did't exists");
        }
        const waiters = info.waiters;
        this.kvstore.clear(uploadSessionId);
        if (waiters > 0) {
            throw new Error(`not finished, abort ${waiters} slice don't writed`);
        }
    }

    async write(_file: string, _position: number, _buf: ArrayBuffer): Promise<number> {
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
        const fstream = await this.createReadableStream(filename, startPosition, length);

        try {
            /* block when other endpoint closed connection, expect throw error
            await util.promisify(pipeline)(fstream, writer);
            return 0;
            */
             return await utils.pipelineWithTimeout(fstream, writer);
        } finally {
            fstream.destroy();
        }
    } //}

    async createReadableStream(_filename: string, _position: number, _length: number): Promise<Readable> {
        throw new FileSystemNotImplemented();
    }

    async createNewFileWithReadableStream(_filename: string, _reader: Readable): Promise<number> {
        throw new FileSystemNotImplemented();
    }

    async canRedirect(_filename: string): Promise<boolean> {
        return false;
    }

    async redirect(_filename: string): Promise<string[]> {
        throw new FileSystemNotImplemented();
    }
}

