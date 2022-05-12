import { AliOSSFileSystem, IAliOSSFileSystemConfig } from './aliOssFileSystem';
import { ILocalFileSystemConfig, LocalFileSystem } from './localFileSystem';
import { IMultiFileSystemConfig, MultiFileSystem } from './multiFileSystem';
import { FileSystem, FileSystemType } from './fileSystem';
import { InjectableFactory, QueryDependency } from '../di';
import { Config, StorageBackendService } from '../../service';
import { nextTick } from 'process';

export { FileSystem } from './fileSystem';

let filesystem: FileSystem;
export class __dummy {
    @InjectableFactory(FileSystem, { lazy: true })
    filesystem(config: Config) {
        let fs: FileSystem;
        switch(config.filesystem.type) {
            case FileSystemType.local:  fs = new LocalFileSystem(config.filesystem as ILocalFileSystemConfig); break;
            case FileSystemType.alioss: fs = new AliOSSFileSystem(config.filesystem as IAliOSSFileSystemConfig); break;
            case FileSystemType.multi:  fs = new MultiFileSystem(config.filesystem as IMultiFileSystemConfig); break;
        }

        if(fs == null) {
            throw new Error(`file system abstraction ${config.filesystem.type} isn't implemented`); 
        }

        // TODO
        nextTick(async () => {
            const storageService = QueryDependency(StorageBackendService);
            await storageService.resetFilesystem();
        });

        filesystem = fs;
        return new Proxy({}, {
            get: function (_target, prop, receiver) {
                return Reflect.get(filesystem, prop, receiver);
            },
            set: function (_target, prop, value, receiver) {
                Reflect.set(filesystem, prop, value, receiver);
                return true;
            }
        });
    }
}

export function SetFilesystem(fs: FileSystem) {
    filesystem = fs;
}
