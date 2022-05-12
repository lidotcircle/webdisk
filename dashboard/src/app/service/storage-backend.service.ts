import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RESTfulAPI } from '../restful';


const API = RESTfulAPI.Store;
@Injectable({
    providedIn: 'root'
})
export class StorageBackendService {
    constructor(private http: HttpClient) {}

    public async addStore(type: string, directory: string, config: Object): Promise<void> {
        await this.http.post(API, {type, directory, config}).toPromise();
    }

    public async changeStoreConfig( directory: string, config: Object): Promise<void> {
        await this.http.put(API, {directory, config}).toPromise();
    }

    public async deleteStore(directory: string): Promise<void> {
        await this.http.delete(API, { params: { directory }}).toPromise();
    }

    public async getStores(): Promise<{type: string, directory: string, config: Object}[]> {
        return await this.http.get(API).toPromise() as any;
    }
}

