import { FileStat, FileType, StorageType } from '../common/file_types';
import { Readable } from 'stream';
import { FileSystem, FileSystemType, IFileSystemConfig } from './fileSystem';
import { createClient, WebDAVClient, AuthType, WebDAVClientOptions, FileStat as WFileStat } from 'webdav';
import { pipelineWithTimeout } from '../utils';


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

        await this.client.customRequest(file, {
            method: "PUT",
            data: buf,
            headers: {
                "Content-Range": `bytes ${start}-${start + buf.byteLength - 1}/*`
            },
        });
    }

    async write(file: string, position: number, buf: ArrayBuffer): Promise<number> {
        await this.client.customRequest(file, {
            method: "PUT",
            data: buf,
            headers: {
                "Content-Range": `bytes ${position}-${position + buf.byteLength - 1}/*`
            },
        });
        return buf.byteLength;
    }

    async createReadableStream(filename: string, position: number, length: number): Promise<Readable>
    {
        return this.client.createReadStream(filename, {
            range: {
                start: position,
                end: position + length - 1,
            },
        });
    }

    async createNewFileWithReadableStream(filename: string, reader: Readable): Promise<number>
    {
        if (filename.startsWith('/')) filename = filename.substring(1);
        const writer = this.client.createWriteStream(filename);
        return await pipelineWithTimeout(reader, writer);
    }

    async canRedirect(_filename: string): Promise<boolean>
    {
        return true;
    }

    async redirect(filename: string): Promise<string[]>
    {
        return [ this.client.getFileDownloadLink(filename) ];
    }
}
