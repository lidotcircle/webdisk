import * as crypto from 'crypto';

import { FileStat } from "lib/common/file_types";
import { Writable } from 'stream';

class FileSystemNotImplemented extends Error {
    constructor() {
        super('File System API Not Implemented');
    }
}

export class FileSystem {
    constructor() {}

    async chmod(file: string, mode: number) {
        throw new FileSystemNotImplemented();
    }

    async copy(src: string, dst: string) {
        throw new FileSystemNotImplemented();
    }

    async copyr(src: string, dst: string) {
        throw new FileSystemNotImplemented();
    }

    async execFile(file: string, argv: string[]): Promise<string> {
        throw new FileSystemNotImplemented();
    }

    async getdir(dir: string): Promise<FileStat[]> {
        throw new FileSystemNotImplemented();
    }

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

    async mkdir(dir: string) {
        throw new FileSystemNotImplemented();
    }

    async move(src: string, dst: string) {
        throw new FileSystemNotImplemented();
    }

    async read(file: string, position: number, length: number): Promise<Buffer> {
        throw new FileSystemNotImplemented();
    }

    async remove(path: string) {
        throw new FileSystemNotImplemented();
    }

    async remover(path: string) {
        throw new FileSystemNotImplemented();
    }

    async stat(file: string): Promise<FileStat> {
        throw new FileSystemNotImplemented();
    }

    async touch(file: string) {
        throw new FileSystemNotImplemented();
    }

    async truncate(file: string, len: number) {
        throw new FileSystemNotImplemented();
    }

    async write(file: string, position: number, buf: ArrayBuffer): Promise<number> {
        throw new FileSystemNotImplemented();
    }

    async writeFileToWritable(filename: string, 
                              writer: Writable, 
                              startPosition: number,
                              length: number = -1): Promise<number> {
        throw new FileSystemNotImplemented();
    }
}

