/** upload files and directories through websocket */
import * as events from 'events';
import * as constants from './constants';
import * as fm from './file_manager';
import * as proc from 'process';
import * as util from './util';
import * as gvar from './global_vars';
import { debug } from './util';

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

type cancelObject = {cancel: boolean};
enum SliceState { NO, IN, HAS };
/**
 * @class UploadSession implementation of uploading files and directories
 * @event fail @fires when a task failed
 *     @param {FileSystemEntry} task
 *     @param {Error} error
 * @event cancel @fires when a task be cancelled
 *     @param {FileSystemEntry} task
 *     @param {Error} error
 * @event start @fires when a task start
 *     @param {FileSystemEntry} task
 * @event progress
 *     @param {FileSystemEntry} represents what task be notified 
 *     @param {number} progressed bytes
 *     @param {number} total bytes
 * @event uploaded @fires when a task finished
 *     @param {FileSystemEntry} task
 */
export class UploadSession extends events.EventEmitter //{
{
    /**
     * @property {[FileSystemEntry, string, cancelObject][]} task_queue queue of upload tasks
     * @property {[FileSystemEntry, string, cancelObject]} currently processing task
     * @property {number} send_bytes how many bytes has send to server in current task
     * @property {number} total_size total bytes of files of current task
     */
    private file_manager: fm.FileManager;
    private task_queue: [FileSystemEntry, string, cancelObject][];
    private currentTask: [FileSystemEntry, string, cancelObject];
    private send_bytes: number;
    private total_size: number;

    /**
     * @param {fm.FileManager} file_manager provide file system RPC
     */
    constructor(file_manager: fm.FileManager) //{
    {
        super();
        this.file_manager = file_manager;
        this.task_queue = [];
        this.currentTask = null;
    } //}

    /** run the tasks */
    private run() //{
    {
        if(this.currentTask) return;
        if(this.task_queue.length == 0) {debug("some bug here"); return;}
        this.currentTask = this.task_queue.shift();
        this.__run().then(() => {
            this.emit("uploaded", this.currentTask[0]);
            this.currentTask = null;
            if(this.task_queue.length > 0) proc.nextTick(() => {this.run();});
        }, (err: Error) => {
            if(err.message == "cancel") this.emit("cancel", this.currentTask[0], err);
            else this.emit("fail", this.currentTask[0], err);
            this.currentTask = null;
            if(this.task_queue.length > 0) proc.nextTick(() => {this.run();});
        });
    } //}

    private async __run() //{
    {
        this.send_bytes = 0;
        this.total_size = 0;
        this.emit("start", this.currentTask[0]);
        await this.get_total_size(this.currentTask[0]);
        await this.send_entry(this.currentTask[0], this.currentTask[1]);
    } //}

    /**
     * @param {FileSystemEntry} entry set this.total_bytes to size of this entry (sum of all files that under this entry)
     */
    private async get_total_size(entry: FileSystemEntry): Promise<void> //{
    {
        if(entry.isFile) {
            let xx: number = await (() => {
                return new Promise((resolve, reject) => {
                    (this.currentTask[0] as FileSystemFileEntry).file((f: File) => {
                        resolve(f.size);
                    }, (err) => {
                        reject(err);
                    });
                });
            })() as number;
            this.total_size += xx;
        } else {
            let dir = this.currentTask[0] as FileSystemDirectoryEntry;
            let entries = await (() => {
                return new Promise((resolve, reject) => {
                    dir.createReader().readEntries(e => resolve(e), err => reject(err));
                });
            })() as FileSystemEntry[];
            for (let i=0; i<entries.length;i++) {
                await this.get_total_size(entries[i]);
            }
        }
    } //}

    /**
     * @param {FileSystemEntry} entry
     * @param {string} p
     */
    private async send_entry(entry: FileSystemEntry, p: string): Promise<void> //{
    {
        if(entry.isFile) {
            let xx = await (() => {
                return new Promise((resolve, reject) => {
                    (this.currentTask[0] as FileSystemFileEntry).file((f: File) => {
                        resolve(f);
                    }, (err) => {
                        reject(err);
                    });
                });
            })() as File;
            return await this.send_file(xx, p);
        } else {
            await this.file_manager.mkdirP(p);
            let dir = this.currentTask[0] as FileSystemDirectoryEntry;
            let entries = await (() => {
                return new Promise((resolve, reject) => {
                    dir.createReader().readEntries(e => resolve(e), err => reject(err));
                });
            })() as FileSystemEntry[];
            for (let i=0; i<entries.length;i++) {
                let x = entries[i];
                this.send_entry(x, util.pathJoin(p, x.name));
            }
        }
    } //}

    /**
     * @param {Blob} slice slice of a file
     * @param {string} p upload path
     */
    private async send_slice(slice: Blob, offset: number, p: string, filesize: number) //{
    {
        let ab = await (slice as any).arrayBuffer();
        let send = util.BufferToHex(ab);
        return this.file_manager.upload_writeP(p, filesize, send, offset);
    } //}

    /**
     * @param {File} f the file object that represents a file in local file system
     * @param {string} p upload path
     */
    private async send_file(f: File, p: string): Promise<void> //{
    {
        let ha = await this.file_manager.uploadP(p, f.size);
        let plan: [number, number][] = [];
        for(let v of ha) {
            let x = v[0];
            while (x + constants.Misc.BufferSize <= v[1]) {
                plan.push([x, x + constants.Misc.BufferSize - 1]);
                x += constants.Misc.BufferSize;
            }
            if(v[1] >= x) {plan.push([x, v[1]]);}
        }
        let errornum: number = 0;
        let sended: SliceState[] = [];
        let error_queue: {message: string, stack: string}[] = [];
        let promises: Promise<void>[] = [];
        for(let i = 0; i<plan.length; i++)
            sended.push(SliceState.NO);
        let HAS_top = -1; // HAS_top + 1 to HAS_TOP + WindowSize should be in HAS or IN State
        while(HAS_top < plan.length - 1) {
            if(this.currentTask[2].cancel) throw new Error("cancel");
            for(let i = HAS_top + 1; i<HAS_top + constants.Misc.WindowSize && i<plan.length; i++) {
                if(sended[i] != SliceState.NO) continue;
                promises[i] = this.send_slice(f.slice(plan[i][0], plan[i][1] + 1), plan[i][0], p, f.size).then(() => {
                    sended[i] = SliceState.HAS;
                    promises[i] = null;
                    this.send_bytes += (plan[i][1] + 1 - plan[i][0]);
                    this.emit("progress", this.currentTask[0], this.send_bytes, this.total_size);
                    if(i == HAS_top + 1) {
                        while (sended[i++] == SliceState.HAS)
                            HAS_top += 1;
                    }
                    return;
                }, (err: Error) => {
                    error_queue.push({message: err.message, stack: err.stack});
                    sended[i] = SliceState.NO;
                    promises[i] = null;
                    errornum += 1;
                    if(errornum > plan.length) throw new Error(JSON.stringify(error_queue, null, 1));
                    return;
                });
            }
            let wait: Promise<void>[] = [];
            for(let i = 0; i<constants.Misc.WindowSize && i<plan.length; i++)
                if(promises[i] != null) wait.push(promises[i]);
            await Promise.race(wait);
        }
        await this.file_manager.upload_mergeP(p, f.size);
        return;
    } //}

    /**
     * create new upload task and append to task queue
     * @param {FileSystemEntry} entry
     * @param {string} dest valid path
     * @return {cancelObject} used for cancelling corresponding task
     */
    newTask(entry: FileSystemEntry, dest: string): cancelObject //{
    {
        dest = util.pathJoin(dest, entry.name);
        if(!constants.Regex.validPathname.test(dest) || entry == null || entry.fullPath == null)
            return null;
        let obj = {cancel: false};
        this.task_queue.push([entry, dest, obj]);
        proc.nextTick(() => this.run());
        return obj;
    } //}

    /** cancel specified task */
    cancel(obj: cancelObject) {obj.cancel = true;}
} //}

export function SetupUpload() {
    gvar.Upload.upload = new UploadSession(gvar.File.manager);
//    gvar.Upload.upload.on("start", debug);
    gvar.Upload.upload.on("fail",  debug);
    gvar.Upload.upload.on("cancel", debug);
}
