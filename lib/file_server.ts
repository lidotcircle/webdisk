import * as annautils from 'annautils';
import * as chokidar from 'chokidar';
import * as net from 'net';
import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as child_proc from 'child_process';

import { debug } from './util';

import * as config from './server_config'
import { WebsocketM, WebsocketOPCode } from './websocket';

/**
 * file operations
 *
 * support upload breakpoint resume
 *
 * 1. client request
 *  a. client
 *    payload := --------------------------------------------
 *               | opcode | path1_len |   path1   | options |
 *               |  1byte |   2byte   | path1_len |   ---   |
 *               --------------------------------------------
 *    opcode := REMOVE | MOVE | GETDIR | CHMOD | CHOWN 
 *            | EXECUTE | GETFILE | UPLOAD | RENAME
 *      if opcode = REMOVE | GETDIR | EXECUTE | GETFILE | UPLOAD |GETDIR
 *          options = null
 *      if opcode = MOVE 
 *          options = [ path2_len | path2 ]
 *      if opcode = CHMOD
 *          options = [ x xxx ] 4bytes
 *      if opcode = CHOWN
 *          options = [ own_len | own ]
 *
 *  b. server
 *     payload := ----------------
 *                | status | opt |
 *                |  1byte |  -  |
 *                ----------------
 * 
 *
 * 2. sever report event
 *  a. server
 *    payload := --------------------------------------------
 *               |  event | path1_len |   path1   | options |
 *               |  1byte |   2byte   | path1_len |   ---   |
 *               --------------------------------------------
 *    event := REMOVE | MOVE | MODIFIED | CHMOD | CHOWN | NEW
 *  b. client
 *     payload := ----------------
 *                | status | opt |
 *                |  1byte |  -  |
 *                ----------------
 *
 * !!!!! FOR SIMPLICITY, USING JSON FORMAT TO IMPLEMENT ABOVE MESSAGE, 
 *       EXCEPT UPLOAD OPERATION. So if @message is Buffer type, the opcode
 *       should be upload.
 */


enum FileOpcode {
    INVALID,
    REMOVE = 10,
    MOVE,
    GETDIR,
    CHMOD,
    CHOWN,
    EXECUTE,
    RENAME,
    GETFILE, // DON'T implement, using HTTP GET
    UPLOAD
}
function opcodeToString(opc: FileOpcode): string //{
{
    switch (opc) {
        case FileOpcode.REMOVE:  return "REMOVE";
        case FileOpcode.MOVE:    return "MOVE";
        case FileOpcode.GETDIR:  return "GETDIR";
        case FileOpcode.CHMOD:   return "CHMOD";
        case FileOpcode.CHOWN:   return "CHOWN";
        case FileOpcode.EXECUTE: return "EXECUTE";
        case FileOpcode.GETFILE: return "GETFILE";
        case FileOpcode.RENAME:  return "RENAME";
        case FileOpcode.UPLOAD:  return "UPLOAD";
    }
    return null;
} //}
function stringToOpcode(str: string): FileOpcode //{
{
    switch (str.trim().toLowerCase()) {
        case "REMOVE":  return FileOpcode.REMOVE;
        case "MOVE":    return FileOpcode.MOVE;
        case "GETDIR":  return FileOpcode.GETDIR;
        case "CHMOD":   return FileOpcode.CHMOD;
        case "CHOWN":   return FileOpcode.CHOWN;
        case "EXECUTE": return FileOpcode.EXECUTE;
        case "RENAME":  return FileOpcode.RENAME;
        case "GETFILE": return FileOpcode.GETFILE;
        case "UPLOAD":  return FileOpcode.UPLOAD;
    }
    return FileOpcode.INVALID;
} //}


enum FileEvent {
    REMOVE,
    MOVE,
    MODIFIED,
    CHMOD,
    CHOWN,
    NEW,
    INVALID
}
function eventToString(event: FileEvent): string //{
{
    switch (event) {
        case FileEvent.REMOVE:   return "REMOVE";
        case FileEvent.MOVE:     return "MOVE";
        case FileEvent.MODIFIED: return "MODIFIED";
        case FileEvent.CHMOD:    return "CHMOD";
        case FileEvent.CHOWN:    return "CHOWN";
        case FileEvent.NEW:      return "NEW";
    }
    return null;
} //}
function stringToEvent(str: string): FileEvent //{
{
    switch (str.trim().toLowerCase()) {
        case "REMOVE":   return FileEvent.REMOVE;
        case "MOVE":     return FileEvent.MOVE;
        case "MODIFIED": return FileEvent.MODIFIED;
        case "CHMOD":    return FileEvent.CHMOD;
        case "CHOWN":    return FileEvent.CHOWN;
        case "NEW":      return FileEvent.NEW;
    }
    return FileEvent.INVALID;
} //}


export enum StatusCode {
    NOENTRY = 20,
    DENIED,
    NOTDIR,
    NOTFILE,

    REQUEST_ERROR,

    FAIL = 100,
    SUCCESS = 200,
}
function statusCodeToString(sc: StatusCode): string //{
{
    switch (sc) {
        case StatusCode.NOENTRY:       return "file doesn't exist";
        case StatusCode.DENIED:        return "permission denied";
        case StatusCode.NOTDIR:        return "not a directory";
        case StatusCode.NOTFILE:       return "not a file";
        case StatusCode.REQUEST_ERROR: return "request error";
        case StatusCode.FAIL:          return "fail";
        case StatusCode.SUCCESS:       return "success";
    }
    return "unknown code";
} //}
function statusCodeToJSON(sc: StatusCode) //{
{
    return {code: sc, message: statusCodeToString(sc)};
} //}


// TODO
/**
 * @class FileControlSession
 * use to control a authenticated session
 */
class FileControlSession
{
    private websocket: WebsocketM;
    private user: config.User;
    private current_loc: string;
    private watcher: chokidar.FSWatcher;
    private invalid: boolean;

    /**
     * @constructor
     * @param {net.Socket} socket upgrade http socket
     * @param {config.User} user  this session belong to the user
     */
    constructor(socket: net.Socket, user: config.User) {
        this.websocket = new WebsocketM(socket);
        this.user = user;
        this.current_loc = null;
        this.watcher = null; // TODO
        this.invalid = false;

        this.websocket.on("message", this.onmessage.bind(this));
        this.websocket.on("error", (err) => {
            debug(`websocket throw exception: ${err}`);
            this.websocket.close(1004);
            this.invalid = true;
        });
        this.websocket.on("close", (clean: boolean) => {
            debug(`websocket closed, clean ? ${clean}`);
        });
        this.websocket.on("end", () => {
            this.websocket.close();
        });
    }

    private send(msg, cb?: (err: Error) => void) {
        if(this.invalid) return;
        this.websocket.send(msg, cb);
    }

    private onmessage(msg: Buffer | string) //{
    {
        if(this.invalid) return;
        if (util.isBuffer(msg)) { // upload
            return;
        }
        let what;
        try {
            what = JSON.parse(msg);
        } catch (err){
            this.send(err.toString());
        }
        let opc: FileOpcode = stringToOpcode(what["opcode"]);
        let reqid: string = what["id"];
        switch (opc) {
            /** @property {string} what["path"] */
            case FileOpcode.GETDIR: //{
                if (!util.isString(what["path"]) ||
                    (what["path"] as string).startsWith("/"))
                    return this.sendfail(reqid, StatusCode.REQUEST_ERROR);
                let dir: string = path.resolve(this.user.DocRoot, (what["path"] as string).substring(1));
                debug(`get stats of ${dir}`);
                annautils.fs.getStatsOfFiles(dir, 1, (err, stats) => {
                    if (err)
                        return this.sendfail(reqid);
                    this.current_loc = dir;
                    this.send(JSON.stringify(stats, (k, v) => {
                        if(k == "filename")
                            return (v as string).substring(this.user.DocRoot.length - (this.user.DocRoot.endsWith("/") ? 1 : 0));
                        return v;
                    }, 1));
                });
                return; //}
            /** @property {string} what["src"]
             *  @property {string} what["dst"] */
            case FileOpcode.MOVE: 
            case FileOpcode.REMOVE:
                let src: string = what["src"] as string;
                let dst: string = what["dst"] as string;
                if (!util.isString(src) || (src as string).startsWith("/") ||
                    !util.isString(dst) || (dst as string).startsWith("/"))
                    return this.sendfail(reqid, StatusCode.REQUEST_ERROR);
                src = path.resolve(this.user.DocRoot, src);
                dst = path.resolve(this.user.DocRoot, dst);
                fs.rename(src, dst, (err) => {
                    if(err) this.sendfail(reqid);
                    else    this.sendsuccess(reqid);
                });
            /** @property {string} what["path"]
             *  @property {string} what["mode"] */
            case FileOpcode.CHMOD:
                let path_: string = what["path"];
                let mode_: string = what["mode"];
                path_ = path.resolve(this.user.DocRoot, path_);
                if (!util.isString(path_) || (path_ as string).startsWith("/") ||
                    !util.isString(mode_))
                    return this.sendfail(reqid, StatusCode.REQUEST_ERROR);
                fs.chmod(path_, mode_, (err) => {
                    if(err) this.sendfail(reqid);
                    else    this.sendsuccess(reqid);
                });
            /** @property {string}   what["path"] *
             *  @property {string[]} what["args"] */
            case FileOpcode.EXECUTE:
                let path__: string    = what["path"];
                let args__:  string[] = what["args"] || [];
                if (!util.isString(path__) || (path__ as string).startsWith("/"))
                    return this.sendfail(reqid, StatusCode.REQUEST_ERROR);
                path__ = path.resolve(this.user.DocRoot, path__);
                child_proc.execFile(path__, args__, (err, stdout, stderr) => {
                    if (err) return this.sendfail(reqid);
                    this.send(JSON.stringify({
                        stdout: stdout,
                        stderr: stderr
                    }, null, 1));
                });
            case FileOpcode.CHOWN:   // impossible
            case FileOpcode.GETFILE: // doesn't implement it
            case FileOpcode.INVALID:
            case FileOpcode.UPLOAD:
                debug(`get error request ${what["opcode"]}`);
                return this.sendfail(reqid);
        }
    } //}

    private sendfail(id: string, code: StatusCode = StatusCode.FAIL) {
        this.send(JSON.stringify(statusCodeToJSON(code), null, 1));
    }

    private sendsuccess(id: string, code: StatusCode = StatusCode.SUCCESS) {
        this.send(JSON.stringify(statusCodeToJSON(code), null, 1));
    }

}
