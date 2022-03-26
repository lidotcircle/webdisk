import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NbToastrService } from '@nebular/theme';
import { Observable, Subject } from 'rxjs';
import { RESTfulAPI } from 'src/app/restful';
import { AuthService } from '../auth';

export class NamedEntry {
    name: string;
    target: string;
    validEnd: Date;
}
interface ServerResponse {
    name: string;
    target: string;
    expireAt: string;
}
@Injectable({
    providedIn: 'root'
})
export class NamedLinkService {
    private _namedlinks_sub: Subject<NamedEntry[]>;
    private _namedlinks: NamedEntry[];
    get namedlinks(): Observable<NamedEntry[]> {
        return new Observable(observer => {
            if (this._namedlinks) {
                observer.next(this._namedlinks);
            }
            return this._namedlinks_sub.subscribe(observer);
        });
    }

    constructor(private authService: AuthService,
                private http: HttpClient,
                private toaster: NbToastrService)
    {
        this._namedlinks_sub = new Subject<NamedEntry[]>();

        this.authService.getJwtClaim().subscribe(claim => {
            if (claim) {
                this.refreshNamedLinks();
            } else {
                this._namedlinks = null;
                this._namedlinks_sub.next(this._namedlinks);
            }
        });
    }

    async refreshNamedLinks() {
        try {
            const links = await this.http.get(RESTfulAPI.NamedLink).toPromise() as ServerResponse[];
            this._namedlinks = links.map(link => {
                return {
                    name: link.name,
                    target: link.target,
                    validEnd: new Date(link.expireAt)
                };
            });
            this._namedlinks_sub.next(this._namedlinks);
        } catch (e) {
            this.toaster.danger(e.message || "Failed to get named links");
        }
    }

    async deleteNamedLink(name: string) {
        await this.http.delete(RESTfulAPI.NamedLink, {
            params: {
                name: name
            }
        }).toPromise();
        try {
        await this.refreshNamedLinks();
        } catch {}
    }

    async createNamedLink(name: string, target: string, duration_ms: number) {
        debugger;
        duration_ms = duration_ms || 1000 * 60 * 60 * 24 * 365 * 100;

        await this.http.post(RESTfulAPI.NamedLink, {
            name: name,
            target: target,
            duration_ms: duration_ms
        }).toPromise();
        this._namedlinks.push({
            name: name,
            target: target,
            validEnd: new Date(Date.now() + duration_ms)
        });
        this._namedlinks_sub.next(this._namedlinks);
    }
}
