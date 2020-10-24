import { Injectable } from '@angular/core';
import { CommonStorage } from './Storage';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService extends CommonStorage {
  constructor() {
    super();
    this.mStorage = window.sessionStorage;
  }
}

