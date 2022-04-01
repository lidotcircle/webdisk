import { getDataSource } from "../index";
import { Repository } from "typeorm";
import { DataRecord } from '../entity';
import { DIProperty, Injectable } from '../lib/di';
import { UserService } from "./user-service";
import createError from "http-errors";


@Injectable({
    lazy: true
})
export class DataRecordService {
    private drRepo: Repository<DataRecord>;
    @DIProperty(UserService)
    private userService: UserService;

    constructor() {
        this.drRepo = getDataSource().getRepository(DataRecord);
    }

    public async insert(username: string, group: string, data: string)
    {
        const user = await this.userService.getUser(username);
        if (!user)
            throw createError(404, `User ${username} not found`);
        const dr = new DataRecord();
        dr.data = data;
        dr.dgroup = group;
        dr.user = Promise.resolve(user);
        this.drRepo.save(dr);
    }
    
    public async getGroups(username: string)
    {
        const user = await this.userService.getUser(username);
        if (!user)
            throw createError(404, `User ${username} not found`);

        const groups = await 
            this.drRepo
            .createQueryBuilder("dr")
            .select("dr.dgroup")
            .distinct(true)
            .where("dr.user = :user", { user: user.id })
            .getRawMany();
        return groups.map(d => d["dr_dgroup"]);
    }

    public async getData(username: string, group: string, pageno: number, pagesize: number):
        Promise<{ count: number; data: {date: string, data: string}[]}>
    {
        const user = await this.userService.getUser(username);
        if (!user)
            throw createError(404, `User ${username} not found`);

        const skip = (pageno ? pageno - 1 : 0) * pagesize;
		const [result, total] = await this.drRepo.findAndCount(
			{
				where: { dgroup: group, userId: user.id }, order: { id: "ASC" },
				take: pagesize,
				skip: skip
			}
		);

		return {
            data: result.map(d  => { return { data: d.data, date: d.createdAt.toISOString() }; }),
			count: total
		}
    }

    public async getAllData(username: string, group: string, skip: number): Promise<{ date: string, data: string }[]>
    {
        const user = await this.userService.getUser(username);
        if (!user)
            throw new createError.NotFound(`User ${username} not found`);

        const result = await this.drRepo.find(
            {
                where: { dgroup: group, userId: user.id },
                order: { id: "ASC" },
                skip: skip
            });
        return result.map(d => { return { data: d.data, date: d.createdAt.toISOString() }; });
    }

    public async deleteGroup(username: string, group: string)
    {
        const user = await this.userService.getUser(username);
        if (!user)
            throw createError(404, `User ${username} not found`);

        await this.drRepo
            .createQueryBuilder("dr")
            .delete()
            .where("dgroup = :group", { group: group })
            .andWhere("user = :user", { user: user.id })
            .execute();
    }
}
