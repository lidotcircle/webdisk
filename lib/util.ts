/* UTILS */

import * as fs   from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as http from 'http';

import * as proc from 'process';

import { Writable } from 'stream';

import * as winston from 'winston';

const logger = winston.createLogger({
    level: "debug",
    format: winston.format.json(),
    defaultMeta: {application: "webdisk", pid: proc.pid},
    transports: [
        new winston.transports.File({filename: path.join(proc.cwd(), "webdisk.log")}),
        new winston.transports.Console()
    ]
});

export function debug(msg) {
    logger.debug(msg);
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
