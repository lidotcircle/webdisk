import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RESTfulAPI } from 'src/app/restful';


@Injectable({
    providedIn: 'root'
})
export class STokenService {
    constructor(private http: HttpClient) {}

    async getSToken(usages: string[], durationMs: number = 5 * 60 * 60 * 1000): Promise<string> {
        try {
            const ans = await this.http.post(RESTfulAPI.SToken, {
                usages: usages.join(","),
                durationMs: durationMs,
            }).toPromise() as { token: string };
            if (!ans) return null;

            return ans.token;
        } catch {
            return null;
        }
    }

    async deleteSToken(token: string): Promise<void> {
        try {
            await this.http.delete(RESTfulAPI.SToken, {
                params: {
                    token: token
                }
            }).toPromise();
        } catch {}
    }
}
