import { FileStat, FileType, StorageType } from "../common/file_types";
import { Readable, Writable } from 'stream';
import { AliOSSFileSystem, IAliOSSFileSystemConfig } from './aliOssFileSystem';
import { FileSystem, FileSystemType, IFileSystemConfig } from './fileSystem';
import { ILocalFileSystemConfig, LocalFileSystem } from './localFileSystem';
import { warn } from '../../service/logger-service';
import path from "path";
import { IWebdavFileSystemConfig, WebdavFileSystem } from "./webdavFilesystem";


export class FSMapping {
    srcPrefix: string;
    dstPrefix: string;
    config: IFileSystemConfig;
    filesystem?: FileSystem;
}
export interface IMultiFileSystemConfig extends IFileSystemConfig {
    data: FSMapping[];
}

class FileHandler {
    filename: string;
    filesystem: FileSystem;
    mapping: FSMapping
}

function fileSystemType2StorageType(ftype: FileSystemType) {
    switch(ftype) {
        case FileSystemType.alioss: return StorageType.alioss;
        case FileSystemType.webdav: return StorageType.webdav;
        default: return StorageType.local;
    }
}

export class MultiFileSystem extends FileSystem {
    private config: IMultiFileSystemConfig;

    constructor(config: IMultiFileSystemConfig) //{
    {
        super();
        if(config.type != this.FSType) {
            throw new Error(`Bad FileSystem constructor for ${config.type}`);
        }
        this.config = JSON.parse(JSON.stringify(config));

        for(const fs of this.config.data) {
            if(!fs.srcPrefix.startsWith('/') || !fs.srcPrefix.endsWith('/') || 
               !fs.dstPrefix.startsWith('/') || !fs.dstPrefix.endsWith('/')) {
                throw new Error(`srcPrefix and dstPrefix should be start and end with '/': '${fs.srcPrefix}', '${fs.dstPrefix}'`);
            }

            try {
                switch(fs.config.type) {
                    case FileSystemType.local: {
                        fs.filesystem = new LocalFileSystem(fs.config as ILocalFileSystemConfig); 
                    } break;
                    case FileSystemType.alioss: {
                        fs.filesystem = new AliOSSFileSystem(fs.config as IAliOSSFileSystemConfig);
                    } break;
                    case FileSystemType.webdav: {
                        fs.filesystem = new WebdavFileSystem(fs.config as IWebdavFileSystemConfig);
                    } break;
                    case FileSystemType.multi: {
                        fs.filesystem = new MultiFileSystem(fs.config as IMultiFileSystemConfig);
                    } break;
                    default: throw new Error('unknow filesystem type');
                }
            } catch (e) {
                warn(e);
            }
        }
    } //}

    /** first meet */
    private resolveToFs(file: string): FileHandler //{
    {
        const tfile = file.endsWith('/') ? file : file + '/';
        const ans = new FileHandler();
        for(const fs of this.config.data) {
            if(tfile.startsWith(fs.srcPrefix)) {
                ans.filesystem = fs.filesystem;
                ans.filename = path.join(fs.dstPrefix, file.substring(fs.srcPrefix.length));
                ans.mapping = fs;
                break;
            }
        }
        if(ans.filesystem == null) {
            throw new Error(`'${file}' Not Found`);
        }
        return ans;
    } //}

    private isFileSystemEntry(path: string): FSMapping //{
    {
        if(!path.endsWith('/')) path += '/';
        for(const fs of this.config.data) {
            if(fs.srcPrefix == path) {
                return fs;
            }
        }
        return null;
    } //}

    private substitutePrefix(origin: string, oldp: string, newp: string): string //{
    {
        if(!origin.startsWith(oldp)) {
            throw new Error('unexpected');
        }
        return newp + origin.substring(oldp.length);
    } //}

    get FSType(): FileSystemType {return FileSystemType.multi;}

    async chmod(file: string, mode: number) //{
    {
        const hd = this.resolveToFs(file);
        await hd.filesystem.chmod(hd.filename, mode);
    } //}

    async copy(src: string, dst: string) //{
    {
        const srch = this.resolveToFs(src);
        const dsth = this.resolveToFs(dst);

        if(srch.filesystem == dsth.filesystem) {
            await srch.filesystem.copy(srch.filename, dsth.filename);
        } else {
            await super.copy(src, dst);
        }
    } //}

    async execFile(file: string, argv: string[]): Promise<string> //{
    {
        const fh = this.resolveToFs(file);
        return await fh.filesystem.execFile(file, argv);
    } //}

    async getdir(dir: string): Promise<FileStat[]> //{
    {
        const hd = this.resolveToFs(dir);
        const ans = await hd.filesystem.getdir(hd.filename);
        for(const vv of ans) {
            vv.filename = this.substitutePrefix(vv.filename, 
                                                hd.mapping.dstPrefix, 
                                                hd.mapping.srcPrefix);
        }

        if(!dir.endsWith('/')) dir += '/';
        for(const fs of this.config.data) {
            if(fs.srcPrefix.startsWith(dir) && /[^\\]+\//.test(fs.srcPrefix.substring(dir.length))) {
                ans.push(this.makeStatFromFSEntryPrefix(fs.srcPrefix, fs.config.type));
            }
        }

        return ans;
    } //}

    async mkdir(dir: string) //{
    {
        if(this.isFileSystemEntry(dir)) {
            throw new Error('File Exists');
        }
        const hd = this.resolveToFs(dir);
        await hd.filesystem.mkdir(hd.filename);
    } //}

    async move(src: string, dst: string) //{
    {
        const srch = this.resolveToFs(src);
        const dsth = this.resolveToFs(dst);

        if(srch.filesystem == dsth.filesystem) {
            await srch.filesystem.move(srch.filename, dsth.filename);
        } else {
            await super.move(src, dst);
        }
    } //}

    async read(file: string, position: number, length: number): Promise<Buffer> //{
    {
        const hd = this.resolveToFs(file);
        return await hd.filesystem.read(hd.filename, position, length);
    } //}

    async remove(path: string) //{
    {
        const hd = this.resolveToFs(path);
        await hd.filesystem.remove(hd.filename);
    } //}

    async remover(path: string) //{
    {
        if(this.isFileSystemEntry(path)) {
            throw new Error('Remove FileSystem Entry is denied');
        }
        const hd = this.resolveToFs(path);
        await hd.filesystem.remover(hd.filename);
    } //}

    private makeStatFromFSEntryPrefix(prefix: string, fstype: FileSystemType): FileStat //{
    {
        const storageType = fileSystemType2StorageType(fstype);
        const ans = new FileStat();
        ans.filename = prefix;
        ans.size = 4 * 1024;
        ans.mode = 623;
        ans.filetype = FileType.dir;
        ans.storageType = storageType;
        return ans;
    } //}
    async stat(file: string): Promise<FileStat> //{
    {
        const entry = this.isFileSystemEntry(file);
        if(entry) {
            return this.makeStatFromFSEntryPrefix(entry.srcPrefix, entry.config.type);
        }
        const hd = this.resolveToFs(file);
        const ans = await hd.filesystem.stat(hd.filename);
        ans.filename = this.substitutePrefix(ans.filename, hd.mapping.dstPrefix, hd.mapping.srcPrefix);
        return ans;
    } //}

    async touch(file: string) //{
    {
        if(this.isFileSystemEntry(file)) return;
        const hd = this.resolveToFs(file);
        await hd.filesystem.touch(hd.filename);
    } //}

    async truncate(file: string, len: number) //{
    {
        const hd = this.resolveToFs(file);
        await hd.filesystem.truncate(hd.filename, len);
    } //}

    async append(file: string, buf: ArrayBuffer): Promise<void> //{
    {
        const hd = this.resolveToFs(file);
        await hd.filesystem.append(hd.filename, buf);
    } //}

    async write(file: string, position: number, buf: ArrayBuffer): Promise<number> //{
    {
        const hd = this.resolveToFs(file);
        return await hd.filesystem.write(hd.filename, position, buf);
    } //}

    async writeFileToWritable(filename: string, //{
                              writer: Writable, 
                              startPosition: number,
                              length: number = -1): Promise<number> 
    {
        const hd = this.resolveToFs(filename);
        return await hd.filesystem.writeFileToWritable(hd.filename, writer, startPosition, length);
    } //}

    async createReadableStream(filename: string, position: number, length: number): Promise<Readable> //{
    {
        const hd = this.resolveToFs(filename);
        return await hd.filesystem.createReadableStream(hd.filename, position, length);
    } //}

    async createNewFileWithReadableStream(filename: string, reader: Readable): Promise<number> //{
    {
        const hd = this.resolveToFs(filename);
        return await hd.filesystem.createNewFileWithReadableStream(hd.filename, reader);
    } //}

    async canRedirect(filename: string): Promise<boolean> //{
    {
        const hd = this.resolveToFs(filename);
        return await hd.filesystem.canRedirect(hd.filename);
    } //}

    async redirect(filename: string): Promise<string[]> //{
    {
        const hd = this.resolveToFs(filename);
        return await hd.filesystem.redirect(hd.filename);
    } //}
}

