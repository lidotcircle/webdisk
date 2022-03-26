import "reflect-metadata"
import assert from "assert";
import { DataSource } from "typeorm"
import { User, RefreshToken, InvitationCode, NamedLink, DataRecord, PasswordStore, UserSetting, UserToken } from '../entity';
import { QueryDependency, ProvideDependency } from "../lib/di";
import { PasswordEncoder } from "../service/password-encoder";
import { Config, debug } from "../service";
import path from 'path';

ProvideDependency(DataSource, {
    lazy: true,
    factory: () => {
        const config = QueryDependency(Config);
        assert(config.initialized());
        const dbpath = path.resolve(config.sqlite3_database);
        debug(`using sqlite3 database '${dbpath}'`);

        return new DataSource({
            type: "sqlite",
            database: dbpath,
            synchronize: true,
            logging: true,
            entities: [ User, RefreshToken, InvitationCode, NamedLink, DataRecord, PasswordStore, UserSetting, UserToken ],
            migrations: [],
            subscribers: [],
        });
    },
    paramtypes: [],
});

async function init_datastore() {
    const datasource = QueryDependency(DataSource);
    const userRepo = datasource.getRepository(User);
    const encoder = QueryDependency(PasswordEncoder);
    const admin = new User();
    admin.username = "admin";
    admin.password = encoder.encode("123456");
    admin.rootpath = "/";
    const savedAdmin = await userRepo.save(admin);
    const usRepo = datasource.getRepository(UserSetting);
    const setting = new UserSetting();
    setting.user = savedAdmin;
    setting.profilePicture = "";
    setting.frontendSettings = "{}";
    await usRepo.save(setting);
}

let datasource_initialized = false;
export async function initializeDataSource() {
    const datasource = QueryDependency(DataSource);
    if (datasource_initialized) {
        console.log('Data source already initialized');
        return;
    }
    datasource_initialized = true;

    try {
        await datasource.initialize();
        const userRepo = datasource.getRepository(User);
        const adminUser = await userRepo.findOne({ where: { username: 'admin' } });
        if (adminUser == null)
            await init_datastore();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

export function getDataSource() {
    assert(datasource_initialized, "Data source not initialized");
    return QueryDependency(DataSource);
}
