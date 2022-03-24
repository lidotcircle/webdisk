import { getDataSource } from "../index";
import { NamedLink } from "../entity";
import { Repository } from "typeorm";
import createError from "http-errors";
import { Injectable, DIProperty } from "../lib/di";
import { UserService } from "./user-service";


@Injectable({
    lazy: true
})
export class NamedLinkService {
    @DIProperty(UserService)
    private userService: UserService;
    private linkRepo: Repository<NamedLink>;

    constructor() {
        this.linkRepo = getDataSource().getRepository(NamedLink);
    }

    public async createLink(username: string, srclink: string, target: string, expireAt: Date): Promise<void> {
        const user = await this.userService.getUser(username);
        if (!user) {
            throw createError(404, "User not found");
        }
        const link = new NamedLink();
        link.name = srclink;
        link.target = target;
        link.expireAt = expireAt;
        link.user = user;
        await this.linkRepo.save(link);
    }

    public async getLink(link: string): Promise<NamedLink> {
        return await this.linkRepo.findOne({
            where: {
                name: link
            }
        });
    }

    public async deleteLink(_link: string): Promise<void> {
        const link = await this.getLink(_link);
        if (!link) {
            throw createError(404, "Link not found");
        }
        await this.linkRepo.remove(link);
    }
}
