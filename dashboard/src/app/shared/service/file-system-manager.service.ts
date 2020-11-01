import { Injectable } from '@angular/core';

export enum FileSystemEvent {
    CHDIR  = 'CHDIR',
    UPDATE = 'UPDATE'
}

@Injectable({
  providedIn: 'root'
})
export class FileSystemManagerService {
  constructor() { }
}

