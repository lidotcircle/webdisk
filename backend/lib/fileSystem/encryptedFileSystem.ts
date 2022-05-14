import { FileStat } from '../common/file_types';
import { Readable, Transform } from 'stream';
import { FileSystem } from './fileSystem';
import { alignedCipherTransform, Forward2Member, skipTransform, stream2buffer, takeTransform } from '../utils';
import { createCipheriv, createDecipheriv, scrypt } from 'crypto';
import { promisify } from 'util';
import createHttpError from 'http-errors';


@Forward2Member('backfs')
export class EncryptedFileSystem extends FileSystem {
    private encryptionKey: string;
    private backfs: FileSystem;

    constructor(fs: FileSystem, encryptionKey: string) {
        super();
        this.backfs = fs;
        this.encryptionKey = encryptionKey;

        if (this.backfs == null)
            throw new Error("ENCRYPTED FS ERROR: underlying filesystem is null");

        if (this.encryptionKey == null || this.encryptionKey == '')
            throw new Error("ENCRYPTED FS ERROR: encryption key MUST not be null or empty");
    }

    private async createCipher(): Promise<Transform> {
        const key = await promisify(scrypt)(this.encryptionKey, 'helloworld', 16);
        const cipher = createCipheriv('aes-128-ecb', key as any, null);
        cipher.setAutoPadding(false);
        return alignedCipherTransform(16, cipher);
    }

    private async createDecipher(): Promise<Transform> {
        const key = await promisify(scrypt)(this.encryptionKey, 'helloworld', 16);
        const decipher = createDecipheriv('aes-128-ecb', key as any, null);
        decipher.setAutoPadding(false);
        return alignedCipherTransform(16, decipher);
    }

    override async getdir(dir: string): Promise<FileStat[]> {
        const ans = await this.backfs.getdir(dir);
        ans.forEach(s => s.encrypted = true);
        return ans;
    }

    override async stat(file: string): Promise<FileStat> {
        const ans = await this.backfs.stat(file);
        ans.encrypted = true;
        return ans;
    }

    override async append(file: string, buf: ArrayBuffer): Promise<void> {
        let start = 0;
        try {
            const stat = await this.stat(file);
            start = stat.size;
        } catch { }

        if (start % 16 != 0) {
            throw new createHttpError.BadRequest("appending file doesn't align with block size");
        }
        const cipher = await this.createCipher();
        const encrypted = await stream2buffer(Readable.from(Buffer.from(buf)).pipe(cipher));
        buf = encrypted.slice(0, buf.byteLength);

        await this.backfs.append(file, buf);
    }

    override async write(file: string, position: number, buf: ArrayBuffer): Promise<number> {
        const ret = position;
        if (position % 16 != 0) {
            const align = Math.floor(position / 16) * 16;
            const pre = await this.read(file, align, position - align);
            buf = Buffer.concat([pre, Buffer.from(buf)]);
            position = align;
        }

        let stat: FileStat;
        try {
            stat = await this.stat(file);
        } catch {}
        const endpos = buf.byteLength + position;
        const lm = Math.floor((endpos) / 16) * 16
        if (lm != endpos && stat?.size >= (lm + 16)) {
            const post = await this.read(file, endpos, lm + 16 - endpos);
            buf = Buffer.concat([Buffer.from(buf), post]);
        }

        await super.write(file, position, buf);
        return ret;
    }

    override async createReadableStream(filename: string, position: number, length: number): Promise<Readable> {
        const encryptInfo = {
            position: position,
            length: length,
        };

        if (position % 16 != 0) {
            const new_position = Math.floor(position / 16) * 16;
            length = length + position - new_position;
            position = new_position;
        }

        if (length % 16 != 0) {
            const stat = await this.stat(filename);
            length = Math.ceil(length / 16) * 16;
            length = Math.min(length, Math.max(stat.size - position, 0));
        }

        let ans = await this.backfs.createReadableStream(filename, position, length);

        const decipher = await this.createDecipher();
        const start = encryptInfo.position - position;
        ans = ans.pipe(decipher).pipe(skipTransform(start)).pipe(takeTransform(encryptInfo.length));

        return ans;
    }

    override async createNewFileWithReadableStream(filename: string, reader: Readable): Promise<number> {
        const cipher = await this.createCipher();
        reader = reader.pipe(cipher);
        return await this.backfs.createNewFileWithReadableStream(filename, reader);
    }

    override async canRedirect(_filename: string): Promise<boolean> {
        return false;
    }

    override async redirect(_filename: string): Promise<string[]> {
        return [];
    }
}
