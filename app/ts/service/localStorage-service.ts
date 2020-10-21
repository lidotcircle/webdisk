import { CommonStorage } from './storage';

export class LocalStorageService extends CommonStorage {
    constructor() {
        super();
        this.mStorage = window.localStorage;
    }
}

