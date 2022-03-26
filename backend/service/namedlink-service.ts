import { getDataSource } from "../index";
import { NamedLink, User } from "../entity";
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

    public async getAllLinks(username: string): Promise<NamedLink[]> {
        const user = await this.userService.getUser(username);
        if (!user) {
            throw createError(404, "User not found");
        }
        const links = await this.linkRepo
            .createQueryBuilder("link")
            .select()
            .leftJoin(User, "user", "link.user = user.id")
            .where("user.username = :name", { name: username })
            .getMany();

        return links.map(link => {
            link.user = undefined;
            link.id = undefined;
            return link;
        });
    }

    public async deleteLink(username: string, _link: string): Promise<void> {
        const link = await this.linkRepo
            .createQueryBuilder("link")
            .select()
            .leftJoin(User, "user", "link.userId = user.id")
            .where("link.name = :name", { name: _link })
            .andWhere("user.username = :username", { username: username })
            .getOne();
        if (!link) {
            throw new createError.NotFound("Link not found");
        }
             
        await this.linkRepo.remove(link);
    }
}
