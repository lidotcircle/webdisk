import { CommonStorage } from './storage';

export class SessionStorageService extends CommonStorage {
    constructor() {
        super();
        this.mStorage = window.sessionStorage;
    }
}

