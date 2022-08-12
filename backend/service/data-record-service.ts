import { getDataSource } from "../index";
import { EntityManager, Repository } from "typeorm";
import { DataRecord, DataRecordGroup } from '../entity';
import { DIProperty, Injectable } from '../lib/di';
import { UserService } from "./user-service";
import { gzip } from 'zlib';
import createError from "http-errors";


interface ServiceRepositories {
    readonly dataRepo:  Repository<DataRecord>;
    readonly groupRepo: Repository<DataRecordGroup>;
};

function EntityManager2Repos(em: EntityManager): ServiceRepositories
{
    return {
        dataRepo:  em.getRepository(DataRecord),
        groupRepo: em.getRepository(DataRecordGroup),
    };
}


@Injectable({
    lazy: true
})
export class DataRecordService {
    private drRepo: Repository<DataRecord>;
    private groupRepo: Repository<DataRecordGroup>;
    @DIProperty(UserService)
    private userService: UserService;

    constructor() {
        this.drRepo = getDataSource().getRepository(DataRecord);
        this.groupRepo = getDataSource().getRepository(DataRecordGroup);
    }

    public async insert(username: string, group: string, data: string)
    {
        const user = await this.userService.getUser(username);
        if (!user)
            throw createError(404, `User ${username} not found`);

        await getDataSource().transaction(async (em: EntityManager) => {
            const repos = EntityManager2Repos(em);

            let dgroup = await repos.groupRepo.findOne({
                where: {
                    dgroup: group,
                    userId: user.id
                }
            });
            if (dgroup == null) {
                dgroup = new DataRecordGroup();
                dgroup.dgroup = group;
                dgroup.userId = user.id;
                dgroup = await repos.groupRepo.save(dgroup);
            } else {
                await repos.groupRepo.update(dgroup.id, {updatedAt: new Date()});
            }

            const dr = new DataRecord();
            dr.data = data;
            dr.groupId = dgroup.id;
            await repos.dataRepo.save(dr);
        });
    }

    public async insertListofDatas(username: string, list: {group: string; data: string}[])
    {
        const user = await this.userService.getUser(username);
        if (!user)
            throw createError(404, `User ${username} not found`);

        await getDataSource().transaction(async (em: EntityManager) => {
            const repos = EntityManager2Repos(em);
            const groupcache = {};
            const saveDatas: DataRecord[] = [];

            for (const gd of list) {
                let dgroup: DataRecordGroup = groupcache[gd.group];
                if (dgroup == null) {
                    dgroup = await repos.groupRepo.findOne({
                        where: {
                            dgroup: gd.group,
                            userId: user.id
                        }
                    });

                    if (dgroup == null) {
                        dgroup = new DataRecordGroup();
                        dgroup.dgroup = gd.group;
                        dgroup.userId = user.id;
                        dgroup.user = Promise.resolve(user);
                        dgroup = await repos.groupRepo.save(dgroup);
                    } else {
                        await repos.groupRepo.update(dgroup.id, {updatedAt: new Date()});
                    }
                    groupcache[gd.group] = dgroup;
                }

                const dr = new DataRecord();
                dr.data = gd.data;
                dr.groupId = dgroup.id;
                saveDatas.push(dr);
            }

            await repos.dataRepo.save(saveDatas);
        });
    }
    
    public async getGroups(username: string, orderByUpdatedAt: boolean=false, ascending: boolean=true)
    {
        const user = await this.userService.getUser(username);
        if (!user)
            throw createError(404, `User ${username} not found`);

        const groups = await 
            this.groupRepo
            .createQueryBuilder("dr")
            .select("dr")
            .where("dr.user = :user", { user: user.id })
            .orderBy(`dr.${orderByUpdatedAt ? 'updatedAt' : 'createdAt'}`, ascending ? 'ASC' : 'DESC')
            .getRawMany();
        return groups.map(d => { return { group: d["dr_dgroup"], createdAt: d['dr_createdAt'], updatedAt: d['dr_updatedAt'] }; });
    }

    public async getData(username: string, group: string, pageno: number, pagesize: number):
        Promise<{ count: number; data: {date: string, data: string}[]}>
    {
        const user = await this.userService.getUser(username);
        if (!user)
            throw createError(404, `User ${username} not found`);

        const dgroup = await this.groupRepo.findOne({
            where: {
                userId: user.id,
                dgroup: group,
            }
        });
        if (!dgroup) {
            return {
                data: [],
                count: 0
            }
        }

        const skip = (pageno ? pageno - 1 : 0) * pagesize;
		const [result, total] = await this.drRepo.findAndCount(
			{
                where: { groupId: dgroup.id }, order: { id: "ASC" },
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

        const dgroup = await this.groupRepo.findOne({
            where: {
                userId: user.id,
                dgroup: group,
            }
        });
        if (!dgroup) {
            return [];
        }

        const result = await this.drRepo.find(
            {
                where: { groupId: dgroup.id },
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

        await this.groupRepo
            .createQueryBuilder("dr")
            .delete()
            .where("dgroup = :group", { group: group })
            .andWhere("userId = :userId", { userId: user.id })
            .execute();
    }

    public async backupData(username: string, require_groups: string[]): Promise<Buffer>
    {
        const user = await this.userService.getUser(username);
        if (!user)
            throw createError(404, `User ${username} not found`);

        const require_groups_set = new Set<string>();
        for (const g of require_groups) require_groups_set.add(g);

        const groups = await this.groupRepo.find({
            where: {
                userId: user.id,
            }
        });
        if (groups.length == 0) {
            return Buffer.from('');
        }

        const allobj = {};
        for (const group of groups) {
            if (!require_groups_set.has(group.dgroup))
                continue;

            const records = (await this.drRepo.find(
                {
                    where: { groupId: group.id }, order: { id: "ASC" },
                }
            )).map(data => { return {data: data.data, createdAt: data.createdAt.getTime()}; });
            allobj[group.dgroup] = records;
        }
        const ans = (await new Promise(resolve => gzip(JSON.stringify(allobj, null, 0), (_, r) => resolve(r)))) as Buffer;
        return ans;
    }
}
