import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RESTfulAPI } from 'src/app/restful';


@Injectable({
    providedIn: 'root'
})
export class InvitationService {
    constructor(private http: HttpClient) { }

    async getInvCodes(): Promise<string[]> {
        const ans = await this.http.get(RESTfulAPI.User.InvCode).toPromise() as { code: string; }[];
        return ans.map(c => c.code);
    }

    async deleteInvCode(code: string): Promise<void> {
        await this.http.delete(RESTfulAPI.User.InvCode, {
            params: {
                invitecode: code
            }
        }).toPromise();
    }

    async newInvCode(): Promise<string> {
        const ans = await this.http.post(RESTfulAPI.User.InvCode, {}).toPromise() as { code: string };
        return ans.code;
    }

    async setInvCodePerms(code: string, perms: { [key: string]: any }): Promise<void> {
        await this.http.put(RESTfulAPI.User.InvCodePerms, perms, {
            params: {invitecode: code}
        }).toPromise();
    }

    async getInvCodePerms(code: string): Promise<{ [key: string]: any}> {
        return await this.http.get(RESTfulAPI.User.InvCodePerms, {
            params: {
                invitecode: code,
            }
        }).toPromise();
    }

    async getUserInfoByInvCode(code: string): Promise<{ [key: string]: any}> {
        return await this.http.get(RESTfulAPI.User.InvCodeUser, {
            params: {
                invitecode: code,
            }
        }).toPromise();
    }
}
