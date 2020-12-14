import { Injectable } from '@angular/core';
import { AsyncKVStorage } from './AsyncKVStorage';

@Injectable({
    providedIn: 'root'
})
export class AsyncLocalStorageService extends AsyncKVStorage {
    constructor() {
        super('localstorage');
    }
}

