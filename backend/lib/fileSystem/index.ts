import { AliOSSFileSystem, IAliOSSFileSystemConfig } from './aliOssFileSystem';
import { LocalFileSystem } from './localFileSystem';
import { IMultiFileSystemConfig, MultiFileSystem } from './multiFileSystem';
import { FileSystem, FileSystemType } from './fileSystem';
import { InjectableFactory } from '../di';
import { Config } from '../../service';

export { FileSystem } from './fileSystem';

export class __dummy {
    @InjectableFactory(FileSystem, { lazy: true })
    filesystem(config: Config) {
        let fs: FileSystem;
        switch(config.filesystem.type) {
            case FileSystemType.local:  fs = new LocalFileSystem(config.filesystem); break;
            case FileSystemType.alioss: fs = new AliOSSFileSystem(config.filesystem as IAliOSSFileSystemConfig); break;
            case FileSystemType.multi:  fs = new MultiFileSystem(config.filesystem as IMultiFileSystemConfig); break;
        }

        if(fs == null) {
            throw new Error(`file system abstraction ${config.filesystem.type} isn't implemented`); 
        }
        return fs;
    }
}

