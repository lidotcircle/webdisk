import { getDataSource } from "../index";
import { User, UserToken } from "../entity";
import { Repository } from "typeorm";
import createError from "http-errors";
import { Injectable, DIProperty } from "../lib/di";
import { UserService } from "./user-service";
import { v4 as uuidv4 } from "uuid";
import assert from "assert";


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
        token.user = Promise.resolve(user);
        token.usage = JSON.stringify(usage);
        token.expireAt = new Date(Date.now() + duration_ms);
        await this.usertokenRepo.save(token);
        return token.tokenid;
    }

    public async deleteToken(username: string, token: string): Promise<boolean> {
        const user = await this.userService.getUser(username);
        assert(user != null);

        const r = await this.usertokenRepo
            .createQueryBuilder()
            .delete()
            .where({
                tokenid: token,
                userId: user.id,
            }).execute();
        return r.affected > 0;
    }

    public async getTokens(username: string, pageno: number, pagesize: number):
        Promise<{ count: number; data: {tokenid: string, usages: string[], expireAt: string}[]}>
    {
        const user = await this.userService.getUser(username);
        if (!user)
            throw createError(404, `User ${username} not found`);

        const skip = (pageno ? pageno - 1 : 0) * pagesize;
		const [result, total] = await this.usertokenRepo.findAndCount(
			{
				where: { userId: user.id }, order: { id: "ASC" },
				take: pagesize,
				skip: skip
			}
		);

		return {
            data: result.map(d  => {
                return { tokenid: d.tokenid, expireAt: d.expireAt.toISOString(), usages: JSON.parse(d.usage) };
            }),
			count: total
		}
    }

    public async validate(token: string, usage: string): Promise<User> {
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
        return await tokenEntity.user;
    }
}
