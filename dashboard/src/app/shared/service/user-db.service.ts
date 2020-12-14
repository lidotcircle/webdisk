import { Injectable } from '@angular/core';
import * as dexie from 'dexie';
import { Dexie } from 'dexie';
import { ForwardGetterProperty, ForwardMethod, TypeOfClassMethod, TypeOfClassProperty } from '../utils';
import { DexieWrapper } from './IndexDBDexieWrapper';

@Injectable({
    providedIn: 'root'
})
export class UserDBService extends DexieWrapper {
    constructor() {
        super("USER_DB");
    }
}

