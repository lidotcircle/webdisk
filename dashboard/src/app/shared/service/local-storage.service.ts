import { Injectable } from '@angular/core';
import { CommonStorage } from './Storage';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService extends CommonStorage {
  constructor() {
    super();
    this.mStorage = window.localStorage;
  }
}

