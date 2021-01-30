import * as crypto from 'crypto';
import * as utils from '../utils';

import { FileStat, FileType } from "../common/file_types";
import { Readable, Writable } from 'stream';

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

    async chmod(file: string, mode: number) {
        throw new FileSystemNotImplemented();
    }

    /**
     * @param {string} src full path of src file 
     * @param {string} dst full path of dst file, overwrite origin file if exists
     */
    async copy(src: string, dst: string) {
        throw new FileSystemNotImplemented();
    }

    /**
     * @param {string} src src should be a directory
     * @param {string} dst if dst exists dst should be a directory, otherwise dst will be create
     */
    async copyr(src: string, dst: string) {
        throw new FileSystemNotImplemented();
    }

    async execFile(file: string, argv: string[]): Promise<string> {
        throw new FileSystemNotImplemented();
    }

    /**
     * @param {string} dir should be a directory
     */
    async getdir(dir: string): Promise<FileStat[]> {
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
     * @param {string} dir shouldn't exist
     */
    async mkdir(dir: string) {
        throw new FileSystemNotImplemented();
    }

    /**
     * @param {string} dir should exist
     */
    async rmdir(dir: string) {
        throw new FileSystemNotImplemented();
    }

    /**
     * @param {string} src should exist
     * @param {string} dst shouldn't exist
     */
    async move(src: string, dst: string) {
        throw new FileSystemNotImplemented();
    }

    async read(file: string, position: number, length: number): Promise<Buffer> {
        throw new FileSystemNotImplemented();
    }

    /**
     * @param {string} path should be full path of a file
     */
    async remove(path: string) {
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
     * @param {string} file should exist
     */
    async stat(file: string): Promise<FileStat> {
        throw new FileSystemNotImplemented();
    }

    /**
     * @param {string} file valid path
     */
    async touch(file: string) {
        throw new FileSystemNotImplemented();
    }

    async truncate(file: string, len: number) {
        throw new FileSystemNotImplemented();
    }

    async append(file: string, buf: ArrayBuffer): Promise<void> {
        throw new FileSystemNotImplemented();
    }

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
        const fstream = await this.createReadableStream(filename, startPosition, length);

        try {
            /* block when other endpoint closed connection, expect throw error
            await util.promisify(pipeline)(fstream, writer);
            return 0;
            */
             return await utils.pipelineWithTimeout(fstream, writer, 5000);
        } finally {
            fstream.destroy();
        }
    } //}

    async createReadableStream(filename: string, position: number, length: number): Promise<Readable> {
        throw new FileSystemNotImplemented();
    }

    async createNewFileWithReadableStream(filename: string, reader: Readable): Promise<number> {
        throw new FileSystemNotImplemented();
    }

    async canRedirect(filename: string): Promise<boolean> {
        return false;
    }

    async redirect(filename: string): Promise<string[]> {
        throw new FileSystemNotImplemented();
    }
}

