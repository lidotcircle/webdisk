    
const dsym = Symbol('directory');
interface FileEx extends File {
    webkitRelativePath: string;
}

export class FileSystemEntryWrapper {

    private _isFile: boolean = false;
    private _isDirectory: boolean = false;
    private _name: string;
    private _file: File;
    private _children: FileSystemEntryWrapper[];
    private constructor() {}

    get isFile() {return this._isFile;}
    get isDirectory() {return this._isDirectory;}
    get name() {return this._name;}
    get file() {return this._file;}
    get children() {return this._children;}

    static async fromFileSystemEntry(entry: FileSystemEntry): Promise<FileSystemEntryWrapper> //{
    {
            const ans = new FileSystemEntryWrapper();

            ans._isFile = entry.isFile;
            ans._isDirectory = entry.isDirectory;
            ans._name = entry.name;
            if(ans._isFile) {
                ans._file = await new Promise((resolve, reject) => {
                    (entry as FileSystemFileEntry).file((f: File) => {
                        resolve(f);
                    }, (err) => {
                        reject(err);
                    });
                });
            } else {
                ans._children = [];
                let dir: FileSystemDirectoryEntry = entry as FileSystemDirectoryEntry;
                let entries: FileSystemEntry[] = await new Promise((resolve, reject) => {
                    dir.createReader().readEntries(e => resolve(e), err => reject(err));
                });
                for (let i=0; i<entries.length;i++) {
                    const wp = await FileSystemEntryWrapper.fromFileSystemEntry(entries[i]);
                    ans._children.push(wp);
                }
            }

            return ans;
        } //}

    static fromFile(file: File, fullpath?: string) //{
    {
        const ans = new FileSystemEntryWrapper;
        ans._isFile = true;
        ans._isDirectory = false;
        ans._name = file.name;
        ans._file = file;
        return ans;
    } //}
    static fromListOfFiles(files: File[]) //{
    {
        const root = {};
        const rootEntry = new FileSystemEntryWrapper();
        rootEntry._isDirectory = true;
        rootEntry._children = [];
        root[dsym] = rootEntry;

        const filexs = files as FileEx[];
        for(const file of filexs) {
            let e = root;
            const splitpath = file.webkitRelativePath.split('/');
            const fname = splitpath.pop();

            for(const n of splitpath) {
                const prevdir = e[dsym] as FileSystemEntryWrapper;
                e[n] = e[n] || {};
                e = e[n];
                if(e[dsym] == null) {
                    const nd = new FileSystemEntryWrapper();
                    nd._isDirectory = true;
                    nd._name = n;
                    nd._children = [];
                    e[dsym] = nd;
                    prevdir.children.push(nd);
                }
            }

            (e[dsym] as FileSystemEntryWrapper)._children.push(FileSystemEntryWrapper.fromFile(file));
        }

        return rootEntry.children;
    } //}

    get size(): number //{
    {
        if(this.isFile) {
            return this.file.size;
        } else {
            let ans = 0;
            for(const entry of this.children) {
                ans += entry.size;
            }
            return ans;
        }
    } //}
}


/** FileSystem API declaration */
type FileSystemEntryCallback = (F: FileSystemEntry) => void;
type ErrorCallback = (E: Error) => void;
export interface FileSystemEntry {
    isFile: boolean,
    isDirectory: boolean,
    name: string,
    fullPath: string,
    filesystem: any,
    getParent(s_cb: FileSystemEntryCallback, e_cb: ErrorCallback)
};
type FileSystemFlags = {exclusive: boolean, create: boolean};
export interface FileSystemDirectoryEntry extends FileSystemEntry {
    createReader: () => FileSystemDirectoryReader,
    getFile: (string, FileSystemFlags, FileSystemEntryCallback, ErrorCallback) => void,
    getDirectory: (string, FileSystemFlags, FileSystemEntryCallback, ErrorCallback) => void
}
export type FileSystemEntriesCallback = (entries: FileSystemEntry[]) => void;
interface FileSystemDirectoryReader {
    readEntries: (successCallback: FileSystemEntriesCallback, errorCallback: ErrorCallback) => void;
}
type FileCallback = (F: File) => void;
export interface FileSystemFileEntry extends FileSystemEntry {
    file: (successCallback: FileCallback, errorCallback: ErrorCallback) => void
}
export interface FileSystem {
    name: string,
    root: FileSystemDirectoryEntry
}

