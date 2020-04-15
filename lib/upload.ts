import * as constants from './constants';
import * as fs from 'fs';
import * as path from 'path';
import * as proc from 'process';
import * as os from 'os';


/**
 * doesn't implement syncronize with file
 * @class UploadMap keep track files that will be uploaded
 */
export class UploadMap //{
{
    /**
     * @property {Map<string, uploadEntry>} entries store <filename, uploadEntry> pairs
     * @property {string} store_file if present syncronize state with this file, otherwise ignore
     */
    private entries: Map<string, UploadEntry>;
    private store_file: string;

    constructor(where?: string) {
        this.store_file = where;
        this.entries = new Map<string, UploadEntry>();
    }

    uploadfile(username: string, filename: string, filesize: number, cb: (err, entry) => void) //{
    {
        let ff = this.entries.get(username + filename);
        if(ff && ff.FileSize == filesize) return cb(null, ff);
        fs.mkdtemp(path.join(os.tmpdir(), "upload_folder"), "utf8", (err, folder) => {
            if(err) return cb(err, null);
            let kk = new UploadEntry(folder, filesize);
            this.entries.set(username + filename, kk);
            cb(null, kk);
        });
    } //}

    untrack(username: string, filename: string) {this.entries.delete(username + filename);}
} //}


/** helper function to sort list of ranges */
function ranges_sort(a: [number, number], b: [number, number]) {return a[0] <= b[0] ? -1 : 1;}
/**
 * @class UploadEntry manage a file upload state.
 */
export class UploadEntry //{
{
    private tempdir: string;
    private filesize: number;
    private uploadedRanges: [number, number][];

    /**
     * after construte new object, the NeedRanges() method should be called
     * @param {string} tempdir the temporary files will reside this directory
     * @param {string} filesize size of the upload file
     */
    constructor(tempdir: string, filesize: number) //{
    {
        this.tempdir = tempdir;
        this.filesize = filesize;
        this.uploadedRanges = null;
    } //}

    /**
     * @exception {Error} when @see uploadedRanges doesn't initialize, throw an error
     */
    private __get_ranges() //{
    {
        if(this.uploadedRanges == null) throw new Error("incorrect ranges");
        this.uploadedRanges.sort(ranges_sort);
        let result = [];
        let currentMax = 0;
        for(let v of this.uploadedRanges) {
            if(v[0] > currentMax)
                result.push([currentMax, v[0] - 1]);
            if (v[1] > currentMax)
                currentMax = v[1];
        }
        if (currentMax < this.filesize)
            result.push([currentMax, this.filesize - 1]);
        return result;
    } //}

    /** write current state to file */
    private __writebackFile(cb: (err) => void) //{
    {
        fs.writeFile(path.join(this.tempdir, constants.TEMP_FILE_ENTRY_NAME), JSON.stringify({
            filesize: this.filesize,
            UploadedRange: this.uploadedRanges
        }, null, 1), (err) => {
            cb(err);
        });
    } //}

    /** syncronize state of this object with file */
    private __syncFile(cb: (err) => void) //{
    {
        fs.readFile(path.join(this.tempdir, constants.TEMP_FILE_ENTRY_NAME), "utf8", (err, data) => {
            if(err) {
                this.uploadedRanges = [];
                return this.__writebackFile(cb);
            } else {
                let dd;
                try {
                    dd = JSON.parse(data);
                } catch (err) {
                    return cb(err);
                }
                if(dd == null || dd["filesize"] == null || dd["UploadedRanges"] == null) {
                    this.uploadedRanges = [];
                    return this.__writebackFile(cb);
                }
            }
        });
    } //}

    /** write a range of file to temporary file */
    WriteRanges(buf: Buffer, ranges: [number,number], cb: (err: Error) => void) //{
    {
        if(buf.length != (ranges[1] - ranges[0] + 1)) return cb(new Error("buffer length error"));
        fs.open(path.join(this.tempdir, `${ranges[0].toString()}-${ranges[1].toString()}`), "w", (err, fd) => {
            if(err) return cb(err);
            fs.write(fd, buf, 0, buf.length, 0, (err) => {
                if(err) return cb(err);
                fs.close(fd, (err) => {
                    return cb(err);
                });
            });
        });
    } //}

    /** get holes of files */
    NeedRanges(cb: (err: Error, ranges: [number, number][]) => void) //{
    {
        if(this.uploadedRanges == null)
            return this.__syncFile(err => {
                if(err) return cb(err, null);
                return cb(null, this.__get_ranges());
            });
        return proc.nextTick(() => cb(null, this.__get_ranges()));
    } //}

    /** a public version of @see __writebackFile() */
    WriteBack(cb: (err) => void) //{
    {
        this.__writebackFile(cb);
    } //}

    /** 
     * @exception {Error} when file doesn't complete, throw an error
     */
    MergeTo(file: string, cb: (err) => void) //{
    {
        if(this.uploadedRanges == null || this.__get_ranges.length != 0) cb(new Error("doesn't complete"));
        fs.open(file, "w", (err, fd) => {
            if (err) return cb(err);
            let currentMax = 0;
            let i = -1;
            let ranges_len = this.uploadedRanges.length;
            let func = () => {
                i += 1;
                if (i == ranges_len) {
                    fs.close(fd, (err) => {
                        return cb(err);
                    });
                    return;
                }
                let v = this.uploadedRanges[i];
                if(v[1] < currentMax) return func();
                fs.open(path.join(this.tempdir, v[0].toString(), "-", v[1].toString()), "r", (err, ffd) => {
                    if(err) return cb(err);
                    let startPosition = currentMax - v[0];
                    let length = v[1] - currentMax + 1;
                    let buf = Buffer.alloc(length);
                    fs.read(ffd, buf, 0, length, startPosition, (err, n, b) => {
                        if(err) return cb(err);
                        if(n != length) return cb(new Error(`range [${v[0]}-${v[1]}] read error in merging file ${file}`));
                        fs.write(fd, buf, 0, length, null, (err, n, b) => {
                            if(err) return cb(err);
                            if(n != length) return cb(new Error(`range [${v[0]}-${v[1]}] write error in merging file ${file}`));
                            currentMax = v[1] + 1;
                            fs.close(ffd, (err) => {
                                if(err) return cb(err);
                                func(); // RESTART
                            });
                        });
                    });
                });
            }
            func();
        });
    } //}

    /** test whether file is full recieved from client */
    full(): boolean {return this.__get_ranges().length == 0;}

    get FileSize(): number {return this.filesize;} 
} //}

