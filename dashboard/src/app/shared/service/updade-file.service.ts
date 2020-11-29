import { Injectable } from '@angular/core';
import { FileSystemManagerService } from './file-system-manager.service';


// FileSystem API declare //{
type FileSystemEntryCallback = (F: FileSystemEntry) => void;
type ErrorCallback = (E: Error) => void;
interface FileSystemEntry {
    isFile: boolean,
    isDirectory: boolean,
    name: string,
    fullPath: string,
    filesystem: any,
    getParent(s_cb: FileSystemEntryCallback, e_cb: ErrorCallback)
};
type FileSystemFlags = {exclusive: boolean, create: boolean};
interface FileSystemDirectoryEntry extends FileSystemEntry {
    createReader: () => FileSystemDirectoryReader,
    getFile: (string, FileSystemFlags, FileSystemEntryCallback, ErrorCallback) => void,
    getDirectory: (string, FileSystemFlags, FileSystemEntryCallback, ErrorCallback) => void
}
type FileSystemEntriesCallback = (entries: FileSystemEntry[]) => void;
interface FileSystemDirectoryReader {
    readEntries: (successCallback: FileSystemEntriesCallback, errorCallback: ErrorCallback) => void;
}
type FileCallback = (F: File) => void;
interface FileSystemFileEntry extends FileSystemEntry {
    file: (successCallback: FileCallback, errorCallback: ErrorCallback) => void
}
interface FileSystem {
    name: string,
    root: FileSystemDirectoryEntry
}
//}


@Injectable({
    providedIn: 'root'
})
export class UpdadeFileService {
    constructor(private fileManager: FileSystemManagerService) {}
}

