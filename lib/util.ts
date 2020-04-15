/* UTILS */

import * as fs   from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as http from 'http';
import { createHash } from 'crypto';
import * as stream from 'stream';

import * as proc from 'process';

import { Writable } from 'stream';

import * as winston from 'winston';

import { getStatusText } from 'http-status-codes';

function getCaller () //{
{
    let reg = /\s+at (\S+)( \(([^)]+)\))?/g;
    let ee: string;
    try {throw new Error();}
    catch (e) {ee = e.stack;}
    reg.exec(ee);
    reg.exec(ee);
    let mm = reg.exec(ee);
    if (!mm) return null;
    return [mm[3], mm[1]];
}; //}

const logger = winston.createLogger({
    level: "debug",
    format: winston.format.json(),
    defaultMeta: {application: "webdisk", pid: proc.pid},
    transports: [
//        new winston.transports.File({filename: path.join("webdisk.log")}),
        new winston.transports.Console()
    ]
});

export function debug(...msg)
{
    if (msg[0] == false) return;
    let caller = getCaller();
    let mmm = caller[0] ? `[${caller[1]} (${caller[0]})]: ` : `[${caller[1]}]: `;
    console.debug(mmm, msg);
}

export function parseCookie(cookie: string): Map<string, string> //{
{
    cookie = cookie || "";
    let ret = new Map<string, string>();
    let s1 = cookie.split(";");
    for (let vv of s1) {
        let kv = vv.split("=");
        kv[1] = kv[1] || "true";
        ret.set(kv[0].trim(), kv[1].trim());
    }
    return ret;
} //}

export function httpRequestToAcyclic(request: http.IncomingMessage) //{
{
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
        url: request.url,
        BAD_POST: request["BAD_POST"] ? true : false
    }
} //}

// range: 'bytes' '=' '#num' '-' ['#num']
export function parseRangeField(range: string): [number, number] //{
{
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
} //}

export function makeid(length: number): string //{
{
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghipqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ )
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    return result;
} //}

/**
 * @param {string} in_key sended by client, is valid base64 encode string,
 *                        the original string is 16 bytes in length
 * @exception {Error} when length of string not conforms with expection or 
 *                    string doesn't a valid base64 string, throw error
 */
export function WebSocketAcceptKey(in_key: string): string //{
{
    let key = Buffer.from(in_key, "base64").toString("ascii");
    if (key.length != 16)
        throw new Error("argument error, doesn't meet expection");
    let concat = in_key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    let sha1Hash = createHash("sha1");
    sha1Hash.update(concat);
    return sha1Hash.digest('base64');
} //}

/**
 * @class BufferStream it's a writable stream, used for save something in memory
 */
class BufferStream extends stream.Writable //{
{
    private buffer: Buffer;
    private static initsize: number = 1024;;
    private size: number;
    private capacity: number;
    constructor() {
        super();
        this.size = 0;
        this.capacity = BufferStream.initsize;
        this.buffer = new Buffer(this.capacity);
    }
    _write(chunk: Buffer | string, enc: string, next) {
        let buf: Buffer = chunk as Buffer;
        enc = enc || "utf8";
        if (!Buffer.isEncoding(enc)) enc = "utf8";
        
        if (util.isString(chunk)) {
            let xx = Buffer.from(chunk as string, enc as any);
        }
        let new_size: number = buf.length + this.size;
        if (new_size > this.capacity) {
            let new_capacity: number = this.capacity * 2;
            while (new_size > new_capacity) {
                new_capacity *= 2;
            }
            let new_buf = new Buffer(new_capacity);
            this.buffer.copy(new_buf, 0, 0, this.size > 0 ? this.size - 1 : 0);
            this.buffer = new_buf;
            this.capacity = new_capacity;
        }
        buf.copy(this.buffer, this.size, 0);
        this.size = new_size;
        next();
    }
    public RawBuffer() {
        return this.buffer.slice(0, this.size);
    }
    public length() {
        return this.size;
    }
} //}

/**
 * @param { number } statusCode
 * @param { string } statusMessage
 * @param { any    } header field-value pair
 * @param { any    } body
 * @exception {Error} if statusMessage is null and statusCode is undefined, throw error
 */
export function simpleHttpResponse(statusCode: number, headers: any, statusMessage: string = null, body: string | Buffer = null): Buffer //{
{
    if (statusMessage == null) {
        statusMessage = getStatusText(statusCode);
    }
    let xx = new BufferStream();
    let content_length: number = null;
    if (body) {
        if (util.isString(body))
            body = Buffer.from(body);
        content_length = body.length;
    }
    xx.write(`HTTP/1.1 ${statusCode} ${statusMessage}\n`);
    for (let x in headers)
        xx.write(`${x}: ${headers[x]}\n`);
    if (content_length) xx.write(`Content-Length: ${content_length}\n`);
    xx.write('\n');
    if (body) xx.write(body);
    return xx.RawBuffer();
} //}

function pathEqual_aux(p1: string, p2: string): boolean {
    if (p1 == p2) return true;
    if (p1.endsWith("/"))
        return p1.substr(0, p1.length - 1) == p2;
    return false;
}
export function pathEqual(p1: string, p2: string): boolean {
    return pathEqual_aux(p1, p2) || pathEqual_aux(p2, p1);
}
