import { getDataSource } from "../index";
import { UserToken } from "../entity";
import { Repository } from "typeorm";
import createError from "http-errors";
import { Injectable, DIProperty } from "../lib/di";
import { UserService } from "./user-service";
import { v4 as uuidv4 } from "uuid";


@Injectable({
    lazy: true
})
export class UserTokenService {
    @DIProperty(UserService)
    private userService: UserService;
    private usertokenRepo: Repository<UserToken>;

    constructor() {
        this.usertokenRepo = getDataSource().getRepository(UserToken);
    }

    public async create(username: string, usage: string[], duration_ms: number): Promise<string> {
        const user = await this.userService.getUser(username);
        if (!user) {
            throw new createError.NotFound("User not found");
        }
        const token = new UserToken();
        token.tokenid = uuidv4();
        token.user = user;
        token.usage = JSON.stringify(usage);
        token.expireAt = new Date(Date.now() + duration_ms);
        await this.usertokenRepo.save(token);
        return token.tokenid;
    }

    public async validate(token: string, usage: string): Promise<boolean> {
        const tokenEntity = await this.usertokenRepo.findOne({
            where: {
                tokenid: token
            }
        });
        if (!tokenEntity) {
            throw new createError.NotFound("Token not found");
        }
        const usageArray = JSON.parse(tokenEntity.usage);
        if (!usageArray.includes(usage)) {
            throw new createError.Forbidden("Token usage not allowed");
        }
        if (tokenEntity.expireAt < new Date()) {
            throw new createError.Forbidden("Token expired");
        }
        return true;
    }
}
