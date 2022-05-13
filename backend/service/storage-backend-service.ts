import { DIProperty, Injectable } from '../lib/di';
import { StorageBackend } from '../entity';
import { Repository } from 'typeorm';
import { UserService } from './user-service';
import { getDataSource } from '../repository/data-source';
import { Config } from './config-service';
import createHttpError from 'http-errors';
import path from 'path';
import { IMultiFileSystemConfig, MultiFileSystem } from '../lib/fileSystem/multiFileSystem';
import { SetFilesystem } from '../lib/fileSystem';
import { warn } from './logger-service';
import { FileSystemType } from '../lib/fileSystem/fileSystem';


@Injectable({
    lazy: true,
})
export class StorageBackendService {
    storageRepo: Repository<StorageBackend>;
    @DIProperty(UserService)
    private userService: UserService;

    constructor(private config: Config) {
        const dataSource = getDataSource();
        this.storageRepo = dataSource.getRepository(StorageBackend);
    }

    private verifyConfig(type: string, config: Object): boolean {
        switch (type) {
            case FileSystemType.alioss:
                if (!config['region'] || !config['accessKeyId'] || !config['accessKeySecret'] || !config['bucket']) {
                    throw new createHttpError.BadRequest('bad config');
                }
                return true;
            case FileSystemType.webdav:
                if (config["remoteUrl"] == null)
                    throw new createHttpError.BadRequest('require remote webdav endpoint');

                return true;
            default:
                throw new createHttpError.BadRequest(`unknown storage type '${type}'`);
        }
    }

    async resetFilesystem() {
        if (this.config.filesystem.type != 'multi')
            return;

        const backends = await this.storageRepo.find();
        if (backends == null) return;

        const config = JSON.parse(JSON.stringify(this.config.filesystem)) as IMultiFileSystemConfig;
        const localSetup = config.data;
        const fms: Map<string,typeof localSetup[0]> = new Map();
        for (const s of localSetup) {
            fms.set(s.srcPrefix, s);
        }

        for (const backend of backends) {
            const backendConfig = JSON.parse(backend.config);
            if (fms.has(backend.srcPrefix)) {
                warn(`duplicated storage backend ${backend.srcPrefix}`);
                continue;
            }

            const config = {
                config: {
                    type: backend.type as any,
                    data: backendConfig,
                },
                srcPrefix: backend.srcPrefix,
                dstPrefix: '/',
            };
            fms.set(backend.srcPrefix, config);
            localSetup.push(config);
        };

        localSetup.sort((a, b) => -a.srcPrefix.localeCompare(b.srcPrefix));
        try {
            const fs = new MultiFileSystem(config);
            SetFilesystem(fs);
        } catch (e) {
            warn(e);
        }
    }

    async addStorageBackend(username: string, type: string, srcPrefix: string, config: Object): Promise<void> {
        if (this.config.filesystem.type != 'multi') {
            throw new createHttpError.BadRequest("not support");
        }

        const user = await this.userService.getUser(username);
        if (!user) throw new createHttpError.InternalServerError('user not found');

        this.verifyConfig(type, config);
        const conf = new StorageBackend();
        conf.userId = user.id;
        conf.user = Promise.resolve(user);
        conf.type = type;
        conf.srcPrefix= path.join(user.rootpath, srcPrefix);
        if (!conf.srcPrefix.endsWith('/'))
            conf.srcPrefix += '/';
        conf.srcPrefixOrigin = srcPrefix
        conf.config = JSON.stringify(config);

        await this.storageRepo.save(conf);
        await this.resetFilesystem();
    }

    async removeStorage(username: string, srcPrefix: string): Promise<void> {
        const user = await this.userService.getUser(username);
        if (!user) throw new createHttpError.InternalServerError('user not found');

        const { affected } = await this.storageRepo.delete({
            userId: user.id,
            srcPrefixOrigin: srcPrefix,
        });

        if (affected == 0) {
            throw new createHttpError.NotFound();
        }

        await this.resetFilesystem();
    }

    async modifyStorageConfig(username: string, directory: string, config: Object) {
        const user = await this.userService.getUser(username);
        if (!user) throw new createHttpError.InternalServerError('user not found');

        const storage = await this.storageRepo.findOneBy({userId: user.id, srcPrefixOrigin: directory});
        if (!storage) throw new createHttpError.NotFound();

        this.verifyConfig(storage.type, config);
        storage.config = JSON.stringify(config);
        await this.storageRepo.save(storage);
        await this.resetFilesystem();
    }

    async getStorages(username: string): Promise<{type: string, directory: string, config: Object}[]> {
        const user = await this.userService.getUser(username);
        if (!user) throw new createHttpError.InternalServerError('user not found');

        const list = await this.storageRepo.find({
            where: {
                userId: user.id,
            }
        });
        return list.map(store => {
            return {
                type: store.type,
                directory: store.srcPrefixOrigin,
                config: JSON.parse(store.config),
            }
        });
    }
}
