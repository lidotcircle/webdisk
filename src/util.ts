/* UTILS */

import * as fs from 'fs';

import { Writable } from 'stream';

export function fwriteToWritable(fd: number, startPosition: number, writer: Writable, length: number = -1,
                         chunksize: number = 1024, cb?: (err, nbytes) => void): void //{
{
    if (chunksize <= 0) {
        return cb(new Error("bad chunksize"), 0);
    }
    let buf = new Buffer(chunksize);
    let writed: number = 0;
    let write_error: Error = null;
    let writer_onerror = (err) => {
        write_error = err;
    };
    writer.on("error", writer_onerror);

    let wrap_cb = (err, nbytes) => {
        writer.removeListener("error", writer_onerror);
        writer.removeListener("drain", func);
        if (cb == null) {
            if (err == null)
                return;
            else
                throw err;
        }
        return cb(err, nbytes);
    };

    let func = () => {
        let chunks: number;
        if ( writed + chunksize > length && length >= 0)
            chunks = length - writed;
        else
            chunks = chunksize;
        fs.read(fd, buf, 0, chunks, writed + startPosition, (err, n, b) => {
            if (err != null || write_error != null)
                return wrap_cb(err || write_error, writed);
            writed += n;
            let cont: boolean = true;
            if (n == 0) {
                if (writed < length)
                    return wrap_cb(new Error(`EOF but can't read length of ${length}`), writed);
                return wrap_cb(null, writed);
            }
            if (n != chunks) { // last nonempty chunk
                let lb = new Buffer(n);
                buf.copy(lb, 0, 0, n - 1);
                writer.write(lb);
                if (writed < length)
                    return wrap_cb(new Error(`EOF but can't read length of ${length}`), writed);
                return wrap_cb(null, writed);
            } else
                cont = writer.write(buf);
            if (cont)
                func();
            else
                writer.once("drain", func);
        });
    };
    func();
} //}

export function writeToWritable(path: string, startPosition: number, writer: Writable, length: number = -1,
                         chunksize: number = 1024, cb?: (err, nbytes) => void): void //{
{
    fs.open(path, "r", (err, fd) => {
        if (err != null)
            return cb(err, 0);
        fwriteToWritable(fd, startPosition, writer, length, chunksize, cb);
    });
} //}

export function parseCookie(cookie: string): Map<string, string> //{
{
    let ret = new Map<string, string>();
    let s1 = cookie.split(";");
    for (let vv of s1) {
        let kv = vv.split("=");
        kv[1] = kv[1] || "true";
        ret.set(kv[0].trim(), kv[1].trim());
    }
    return ret;
} //}

