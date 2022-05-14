import { FileSystemFactory } from './multiFileSystem';
import { FileSystem } from './fileSystem';
import { InjectableFactory, QueryDependency } from '../di';
import { Config, StorageBackendService } from '../../service';
import { nextTick } from 'process';

export { FileSystem } from './fileSystem';


let filesystem: FileSystem;
export class __dummy {
    @InjectableFactory(FileSystem, { lazy: true })
    filesystem(config: Config) {
        const fs: FileSystem = FileSystemFactory(config.filesystem);

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
