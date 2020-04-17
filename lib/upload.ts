import * as fs from 'fs';
import * as proc from 'process';
import * as timer from 'timers';
import * as annautils from 'annautils';

import {debug} from './util';


/**
 * @class UploadMap keep track files that will be uploaded
 */
export class UploadMap //{
{
    /**
     * @property {Map<string, uploadEntry>} entries store <filename, uploadEntry> pairs
     */
    private entries: Map<string, UploadEntry>;

    constructor() {
        this.entries = new Map<string, UploadEntry>();
    }

    uploadfile(username: string, filename: string, filesize: number): UploadEntry //{
    {
        let ff = this.entries.get(username + filename);
        if(ff && ff.FileSize == filesize) return ff;
        if(ff) ff.clean();
        ff = new UploadEntry(filename, filesize, () => {
            this.untrack(username, filename);
        });
        this.entries.set(username + filename, ff);
        return ff;
    } //}

    query(username: string, filename: string): UploadEntry {return this.entries.get(username + filename);}

    untrack(username: string, filename: string) {
        let x = this.entries.get(username + filename);
        this.entries.delete(username + filename);
    }
} //}


/** file descriptor field state */
enum FdState { Closed, InOpen, Open, InClose, Error};
/** if a upload file entry is tale, delete partial file and release this entry */
const UploadTimeout = 8 * 60 * 1000;
/** helper function to sort list of ranges */
function ranges_sort(a: [number, number], b: [number, number]) {return a[0] <= b[0] ? -1 : 1;}
/**
 * @class UploadEntry manage a file upload state.
 */
export class UploadEntry //{
{
    private cleancb: Function;
    private filepath: string;
    private filesize: number;
    private fdState: FdState;
    private fd: number;
    private uploadedRanges: [number, number][];
    private error: Error;
    private uploadTimer;
    private lastTime;

    /**
     * @param {string} filesize size of the upload file
     */
    constructor(filepath, filesize, cleancb) //{
    {
        this.cleancb = cleancb;
        this.filepath = filepath;
        this.filesize = filesize;
        this.uploadedRanges = [];
        this.fdState = FdState.Closed;
        this.fd = null;
        this.error = null;
        this.uploadTimer = timer.setTimeout(() => {
            this.clean();
        }, UploadTimeout);
        this.lastTime = Date.now();
        this.open_file((err) => {});
    } //}

    private open_file(cb: (err: Error) => void) //{
    {
        if(this.fdState == FdState.Open) return cb(null);
        if(this.fdState == FdState.Error) return cb(this.error);
        if(this.fdState == FdState.InOpen) return proc.nextTick(() => {
            this.open_file(cb);
        });
        if(this.fdState == FdState.InClose) return cb(new Error("fd is closing"));
        this.fdState = FdState.InOpen;
        annautils.fs.touch(this.FilePath, (err) => {
            if(err) {
                    this.error = err;
                    this.fdState = FdState.Error;
                    return cb(this.error);
            }
            fs.open(this.filepath, "r+", (err, fd) => {
                if(err) {
                    this.error = err;
                    this.fdState = FdState.Error;
                    return cb(this.error);
                }
                this.fd = fd;
                this.fdState = FdState.Open;
                cb(null);
            });
        });
    } //}
    
    private reset_timeout() //{
    {
        if (Date.now() - this.lastTime < UploadTimeout / 2)
            return;
        timer.clearTimeout(this.uploadTimer);
        this.uploadTimer = timer.setTimeout(() => {
            this.clean();
        }, UploadTimeout);
        this.lastTime = Date.now();
    } //}

    NeedRanges(): [number, number][] //{
    {
        this.uploadedRanges.sort(ranges_sort);
        let result = [];
        let currentMax = 0;
        for(let v of this.uploadedRanges) {
            if(v[0] > currentMax)
                result.push([currentMax, v[0] - 1]);
            if (v[1] > currentMax)
                currentMax = v[1] + 1;
        }
        if (currentMax < this.filesize)
            result.push([currentMax, this.filesize - 1]);
        return result;
    } //}

    /** write a range of file to temporary file */
    WriteRanges(buf: Buffer, ranges: [number,number], cb: (err: Error) => void) //{
    {
        this.reset_timeout();
        this.open_file((err) => {
            if(err) return cb(err);
            if(buf.length != (ranges[1] - ranges[0] + 1)) return cb(new Error("buffer length error"));
            fs.write(this.fd, buf, 0, buf.length, ranges[0], (err, n, b) => {
                if(!err) this.uploadedRanges.push(ranges);
                cb(err);
            });
        });
    } //}

    clean(cb: (err) => void = null) //{
    {
        cb = cb || ((err) => {debug(err);});
        if(this.fdState == FdState.Open) {
            this.fdState = FdState.InClose;
            fs.close(this.fd, (err) => {
                if(err)
                    this.fdState = FdState.Error;
                else 
                    this.fdState = FdState.Closed;
                proc.nextTick(() => this.clean(cb));
            });
            return;
        }
        if(!this.full()) {
            fs.unlink(this.FilePath, (err) => {
            });
        }
        this.cleancb();
    } //}

    full(): boolean {return this.NeedRanges().length == 0;}

    get FileSize(): number {return this.filesize;} 

    get FilePath(): string {return this.filepath;}
} //}

