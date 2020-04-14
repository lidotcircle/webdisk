/** upload files and directories through websocket */
import * as events from 'events';
import * as constants from './constants';
import * as fm from './file_manager';
import * as proc from 'process';

type uploadTask = {
    isFile: boolean,
    isDirectory: boolean,
    taskName: string
};
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
    createReader: FileSystemDirectoryReader,
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

/**
 * @class UploadSession implementation of uploading files and directories
 * @event fail @fires when a task failed
 *     @param {uploadTask} task
 * @event start @fires when a task start
 *     @param {uploadTask} task
 * @event progress
 *     @param {uploadTask} represents what task be notified 
 *     @param {number} progressed bytes
 *     @param {number} total bytes
 * * @event uploaded @fires when a task finished
 *     @param {uploadTask} task
 */
class UploadSession extends events.EventEmitter {
    private file_manager: fm.FileManager;
    private task_queue: [FileSystemEntry, string][];
    private running: boolean;

    constructor(file_manager: fm.FileManager) {
        super();
        this.file_manager = file_manager;
        this.task_queue = [];
        this.running = false;
    }

    private __run() {
        if(this.running) return;
    }

    private __run_continue() {
    }

    /**
     * @param {FileSystemEntry} entry
     * @param {string} dest valid path
     */
    newTask(entry: FileSystemEntry, dest: string): boolean {
        if(!constants.Regex.validPathname.test(dest) || entry == null || entry.fullPath == null)
            return false;
        this.task_queue.push([entry, dest]);
        proc.nextTick(() => this.__run());
        return true;
    }
}








