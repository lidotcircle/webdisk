/* UTILS */

import * as fs   from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as http from 'http';

import * as proc from 'process';

import { Writable } from 'stream';

export function fwriteToWritable(fd: number, startPosition: number, writer: Writable, length: number = -1,
                         chunksize: number = 1024, callend: boolean = true, cb?: (err, nbytes) => void): void //{
{
    if (chunksize <= 0) {
        return cb(new Error("bad chunksize"), 0);
    }
    let buf = new Buffer(chunksize);
    let writed: number = 0;
    let write_error: Error = null;
    let writer_onerror = (err) => {
        write_error = err || write_error;
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
                if (callend) writer.end();
                return wrap_cb(null, writed);
            }
            if (n != chunksize) { // last nonempty chunk
                let lb = new Buffer(n);
                buf.copy(lb, 0, 0, n - 1);
                writer.write(lb, writer_onerror);
                if (callend) writer.end();
                if (writed < length)
                    return wrap_cb(new Error(`EOF but can't read length of ${length}`), writed);
                return wrap_cb(null, writed);
            } else {
                cont = writer.write(buf, writer_onerror);
            }
            if (cont)
                // why direct call this function will cause in ServerResponse stream last chunk be writed twice,
                // but when change to other Writable stream without this error.
                proc.nextTick(func); 
            else
                writer.once("drain", func);
        });
    };
    func();
} //}

export function writeToWritable(path: string, startPosition: number, writer: Writable, length: number = -1,
                         chunksize: number = 1024, callend: boolean = true, cb?: (err, nbytes) => void): void //{
{
    fs.open(path, "r", (err, fd) => {
        if (err != null)
            return cb(err, 0);
        fwriteToWritable(fd, startPosition, writer, length, chunksize, callend, cb);
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

export function chmod_files(dir: string, mode: any, level: number = 1/* start with 1 */, 
                            filematch: RegExp = /.*/, cb: (err: Error, num: number) => void = null): void {
    let num: number = 0;
    let nerr: number = 0;
    let callback_m = (err, num: number) => {
        if (err) throw err;
    }
    let error: Error = null;
    let cn: number = 0;
    cb = cb || callback_m;
    let callback_x = (err) => {
        error = err;
        dec_cn();
    }
    let inc_cn = () => {
        cn += 1;
    }
    let dec_cn = () => {
        cn -= 1;
        if(cn == 0) cb(error, num);
    }
    let ffff = (d, l) => {
        if (l == 0) return;
        inc_cn();
        fs.readdir(d, "utf8", (err, files) => {
            if(err) nerr += 1;
            if(err || error) return callback_x(err || error);
            for (let file of files) {
                let new_path = path.join(dir, file);
                inc_cn();
                fs.stat(new_path, (err, stat) => {
                    if(err) nerr += 1;
                    if(err || error) return callback_x(err || error);
                    if(stat.isDirectory()) {
                        ffff(new_path, l - 1);
                    } else if (stat.isFile()) {
                        if (!filematch.test(new_path)) return dec_cn();
                        inc_cn();
                        fs.chmod(new_path, mode, (err) => {
                            if (!err) num += 1;
                            if(err) nerr += 1;
                            if(err || error) return callback_x(err || error);
                            dec_cn();
                        });
                    }
                    dec_cn();
                });
            }
            dec_cn();
        });
    }
    ffff(dir, level);
}

export const chmodFiles: (dir: string, mode: any, level: number, filematch: RegExp) => Promise<number>
    = util.promisify(chmod_files);

export function httpRequestToAcyclic(request: http.IncomingMessage) {
    return {
        headers: request.headers,
        httpVersion: request.httpVersion,
        httpVersionMajo: request.httpVersionMajor,
        httpVersionMino: request.httpVersionMinor,
        method: request.method,
        rawHeaders: request.rawHeaders,
        rawTrailers: request.rawTrailers,
        statusCode: request.statusCode,
        statusMessage: request.statusMessage,
        trailers: request.trailers,
        url: request.url
    }
}

// range: 'bytes' '=' '#num' '-' ['#num']
export function parseRangeField(range: string): [number, number] {
    if(range == null || range.length < 8 || !range.startsWith("bytes=")) return null;
    let nnn = range.substring(6);
    let fff = nnn.split("-");
    if (fff.length != 2) return null;
    let r1: number, r2: number;
    r1 = parseInt(fff[0]);
    if (r1 < 0 || r1 == NaN) return null;
    if (fff[1] == "") {
        return [r1, -1];
    } else {
        r2 = parseInt(fff[1]);
        if(r1 <= r2) return [r1, r2];
    }
    return null;
}
