import "reflect-metadata"
import assert from "assert";
import { DataSource } from "typeorm"
import { User } from "../entity/User"
import { RefreshToken } from "../entity/RefreshToken"
import { InvitationCode } from "../entity/InvitationCode"
import { QueryDependency, ProvideDependency } from "../lib/di";
import { PasswordEncoder } from "../service/password-encoder";
import { Config } from "../lib/config";

ProvideDependency(DataSource, {
    lazy: true,
    factory: () => {
        const config = QueryDependency(Config);

        return new DataSource({
            type: "sqlite",
            database: config.sqlite3_database2,
            synchronize: true,
            logging: true,
            entities: [ User, RefreshToken, InvitationCode ],
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
    userRepo.save(admin);
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
