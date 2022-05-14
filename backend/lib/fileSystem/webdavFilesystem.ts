import { FileStat, FileType, StorageType } from '../common/file_types';
import { Readable, Transform } from 'stream';
import { FileSystem, FileSystemType, IFileSystemConfig } from './fileSystem';
import { createClient, WebDAVClient, AuthType, WebDAVClientOptions, FileStat as WFileStat } from 'webdav';
import { alignedCipherTransform, pipelineWithTimeout, skipTransform, stream2buffer, takeTransform } from '../utils';
import { createCipheriv, createDecipheriv, scrypt } from 'crypto';
import { promisify } from 'util';
import createHttpError from 'http-errors';

class WebdavFileSystemNotImplemented extends Error { }

function WFileStat2FileStat(stat: WFileStat) {
    const ans = new FileStat();
    ans.storageType = StorageType.webdav;
    ans.filename = stat.filename;
    ans.filetype = stat.type == 'file' ? FileType.reg : FileType.dir;
    ans.size = stat.size;
    ans.mtimeMs = new Date(stat.lastmod).getTime();
    return ans;
}

export interface IWebdavFileSystemConfig extends IFileSystemConfig {
    data: {
        remoteUrl: string;
        authType?: AuthType;
        headers?: { [key: string]: string };
        httpAgent?: string;
        httpsAgent?: string;
        username?: string;
        password?: string;
        token?: Object;
        encryptionKey?: string;
    }
}

export class WebdavFileSystem extends FileSystem {
    private client: WebDAVClient;
    private encryptionKey: string;

    get FSType(): FileSystemType { return FileSystemType.webdav; }

    constructor(config: IWebdavFileSystemConfig) {
        super();

        if (config.data?.remoteUrl == null) {
            throw new Error("unexpect webdav remote endpoint");
        }

        const options = {} as WebDAVClientOptions;
        Object.assign(options, config.data);
        delete (options as any).remoteUrl;
        this.client = createClient(config.data.remoteUrl, options);
        this.encryptionKey = config.data.encryptionKey;
        if (!this.encryptionKey?.length) this.encryptionKey = null;
    }

    private async createCipher(): Promise<Transform> {
        const key =  await promisify(scrypt)(this.encryptionKey, 'helloworld', 16);
        const cipher = createCipheriv('aes-128-ecb', key as any, null);
        cipher.setAutoPadding(false);
        return alignedCipherTransform(16, cipher);
    }
    
    private async createDecipher(): Promise<Transform> {
        const key =  await promisify(scrypt)(this.encryptionKey, 'helloworld', 16);
        const decipher = createDecipheriv('aes-128-ecb', key as any, null);
        decipher.setAutoPadding(false);
        return alignedCipherTransform(16, decipher);
    }

    async chmod(_file: string, _mode: number) {
        throw new WebdavFileSystemNotImplemented();
    }

    async copy(src: string, dst: string)
    {
        await this.client.copyFile(src, dst);
    }

    // TODO
    // async copyr(src: string, dst: string)
    // {
    // }

    async execFile(_file: string, _argv: string[]): Promise<string> {
        throw new WebdavFileSystemNotImplemented();
    }

    async getdir(dir: string): Promise<FileStat[]>
    {
        const list = await this.client.getDirectoryContents(dir);
        const flist = list as WFileStat[];
        return flist.map(WFileStat2FileStat);
    }

    async mkdir(dir: string)
    {
        await this.client.createDirectory(dir);
    }

    async move(src: string, dst: string)
    {
        // TODO
        await this.client.moveFile(src, dst);
    }

    async read(file: string, position: number, length: number): Promise<Buffer>
    {
        return await stream2buffer(await this.createReadableStream(file, position, length));
    }

    async remove(path: string)
    {
        await this.client.deleteFile(path);
    }
    async rmdir(path: string)
    {
        if (!path.endsWith('/')) path += '/';
        await this.client.deleteFile(path);
    }

    async stat(file: string): Promise<FileStat>
    {
        return WFileStat2FileStat(await this.client.stat(file) as WFileStat);
    }

    async touch(file: string)
    {
        try {
            await this.stat(file);
        } catch {
            await this.client.putFileContents(file, '');
        }
    }

    async truncate(_file: string, _len: number) {
        throw new WebdavFileSystemNotImplemented();
    }

    async append(file: string, buf: ArrayBuffer): Promise<void>
    {
        let start = 0;
        try {
            const stat = await this.stat(file);
            start = stat.size;
        } catch {}

        if (this.encryptionKey) {
            if (start % 16 != 0) {
                throw new createHttpError.BadRequest("appending file doesn't align with block size");
            }

            const cipher = await this.createCipher();
            const encrypted = await stream2buffer(Readable.from(Buffer.from(buf)).pipe(cipher));
            buf = encrypted.slice(0, buf.byteLength);
        }

        await this.client.customRequest(file, {
            method: "PUT",
            data: buf,
            headers: {
                "Content-Range": `bytes ${start}-${start + buf.byteLength - 1}/*`
            },
        });
    }

    async write(_file: string, _position: number, _buf: ArrayBuffer): Promise<number> {
        throw new WebdavFileSystemNotImplemented();
    }

    async createReadableStream(filename: string, position: number, length: number): Promise<Readable>
    {
        let encryptInfo: {position: number, length: number} = null;
        if (this.encryptionKey) {
            encryptInfo = {
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
        }

        let ans = this.client.createReadStream(filename, {
            range: {
                start: position,
                end: position + length - 1,
            },
        });

        if (encryptInfo) {
            const decipher = await this.createDecipher();
            const start = encryptInfo.position - position;
            ans = ans.pipe(decipher).pipe(skipTransform(start)).pipe(takeTransform(encryptInfo.length));
        }

        return ans;
    }

    async createNewFileWithReadableStream(filename: string, reader: Readable): Promise<number>
    {
        if (filename.startsWith('/')) filename = filename.substring(1);
        const writer = this.client.createWriteStream(filename);
        if (this.encryptionKey) {
            const cipher = await this.createCipher();
            reader = reader.pipe(cipher);
        }
        return await pipelineWithTimeout(reader, writer);
    }

    async canRedirect(_filename: string): Promise<boolean>
    {
        return this.encryptionKey == null;
    }

    async redirect(filename: string): Promise<string[]>
    {
        if (this.encryptionKey) return [];
        return [ this.client.getFileDownloadLink(filename) ];
    }
}
