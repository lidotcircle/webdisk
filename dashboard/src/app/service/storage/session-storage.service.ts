import { Injectable } from '@angular/core';
import { CommonStorage } from './common-storage';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService extends CommonStorage {
  constructor() {
    super();
    this.mStorage = window.sessionStorage;
  }
}

