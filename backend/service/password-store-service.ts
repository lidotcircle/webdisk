import { getDataSource } from "../index";
import { PasswordStore } from "../entity";
import { Repository } from "typeorm";
import createError from "http-errors";
import { Injectable, DIProperty } from "../lib/di";
import { UserService } from "./user-service";


type PasswordInfo = {
    id: number,
    site: string,
    account: string,
    password: string,
}

@Injectable({
    lazy: true
})
export class PasswordStoreService {
    @DIProperty(UserService)
    private userService: UserService;
    private passRepo: Repository<PasswordStore>;

    constructor() {
        this.passRepo = getDataSource().getRepository(PasswordStore);
    }

    public async createPass(username: string, site: string, account: string, password: string): Promise<number> {
        const user = await this.userService.getUser(username);
        if (!user) {
            throw new createError.NotFound("User not found");
        }
        const store = new PasswordStore();
        store.user = user;
        store.site = site;
        store.account = account;
        store.password = password;
        await this.passRepo.save(store);
        return store.id;
    }

    public async updatePass(id: number, username: string, site: string, account: string, password: string): Promise<void> {
        const user = await this.userService.getUser(username);
        if (!user) {
            throw new createError.NotFound("User not found");
        }
        const store = await this.passRepo.findOne({
            where: {
                id: id,
                userId: user.id,
            }
        });
        if (!store) {
            throw new createError.NotFound("Password not found");
        }
        store.site = site;
        store.account = account;
        store.password = password;
        await this.passRepo.save(store);
    }

    public async deletePass(id: number, username: string) {
        const user = await this.userService.getUser(username);
        if (!user) {
            throw new createError.NotFound("User not found");
        }
        const store = await this.passRepo.findOne({
            where: {
                userId: user.id,
                id: id
            }
        });
        if (!store) {
            throw new createError.NotFound("Password not found");
        }
        await this.passRepo.remove(store);
    }

    public async getPasswords(username: string): Promise<PasswordInfo[]> {
        const user = await this.userService.getUser(username);
        if (!user) {
            throw new createError.NotFound("User not found");
        }
        const ans = await this.passRepo.find({
            where: {
                userId: user.id
            }
        });
        return ans.map(x => ({
            id: x.id,
            site: x.site,
            account: x.account,
            password: x.password
        }));
    }
}
