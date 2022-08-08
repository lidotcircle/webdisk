import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RESTfulAPI } from '../restful';


type PageData = { count: number ; data: string[] };
const API = RESTfulAPI.DataRecord;
@Injectable({
    providedIn: 'root'
})
export class DataRecordService {
    constructor(private http: HttpClient) {
    }

    public async getGroups(sortbyudpate: boolean, desc: boolean): Promise<{createdAt: string, updatedAt: string, group: string}[]> {
        return await this.http.get<string[]>(API.groups, {
            params: {
                sortBy: sortbyudpate ? 'updatedDate' : 'createdDate',
                order: desc ? 'DESC' : 'ASC',
            }
        }).toPromise() as any;
    }

    public async deleteGroup(group: string): Promise<void> {
        await this.http.delete(API.record, {
            params: {
                group: group
            }
        }).toPromise();
    }

    public async addRecord(group: string, data: string): Promise<void> {
        await this.http.post(API.record, {
            group: group,
            data: data
        }).toPromise();
    }

    public async getGroupData(group: string, pagesize: number, pageno: number): Promise<PageData> {
        return await this.http.get<PageData>(API.groupData, {
            params: {
                group: group,
                pagesize: pagesize.toString(),
                pageno: pageno.toString()
            }
        }).toPromise();
    }

    public async getGroupAllData(group: string, skip: number = 0): Promise<string[]> {
        return await this.http.get<string[]>(API.groupAllData, {
            params: {
                group: group,
                skip: skip.toString()
            }
        }).toPromise();
    }
}

