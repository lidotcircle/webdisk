import * as annautils from 'annautils';
import * as chokidar from 'chokidar';
import * as net from 'net';
import * as util from 'util';
import * as http from 'http';
import * as proc from 'process';
import * as path from 'path';
import * as fs from 'fs';
import * as child_proc from 'child_process';
import { URL } from 'url';

import { debug } from './util';
import * as xutil from './util';

import * as timers from 'timers';

import * as config from './server_config'
import * as constants from './constants'
import { WebsocketM, WebsocketOPCode } from './websocket';

/** file operations //{
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
 */ //}


enum FileOpcode {
    CHMOD   = "chmod",
    COPY    = "copy",
    EXECUTE = "execute",
    GETDIR  = "getdir",
    INVALID = "invalid",
    MKDIR   = "mkdir",
    MOVE    = "move",
    READ    = "read",
    REMOVE  = "remove",
    RENAME  = "rename",
    STAT    = "stat",
    TOUCH   = "touch",
    TRUNCATE   = "truncate",
    WRITE   = "write",
}

enum FileEvent {
    REMOVE = "remove",
    MOVE = "move",
    MODIFIED = "modified",
    CHMOD = "chmod",
    CHOWN = "chown",
    NEW = "new",
    INVALID = "invalid"
}


export enum StatusCode {
    NOENTRY = 20,
    DENIED,
    NOTDIR,
    NOTFILE,

    BAD_OPCODE = 40,
    BAD_ID,
    BAD_ARGUMENTS,
    FS_REPORT_ERROR,
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
        case StatusCode.BAD_OPCODE:    return "bad opcode";
        case StatusCode.BAD_ID:        return "bad id";
        case StatusCode.BAD_ARGUMENTS: return "bad arguments";
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

/**
 * a handler of upgrade event in http server, it will accept websocket connection,
 * paramters just like parameters of upgrade event
 */
export function upgradeHandler(inc: http.IncomingMessage, socket: net.Socket, buf: Buffer, conf: config.ServerConfig) //{
{
    let date = (new Date()).toUTCString();
    if (inc.url != "/") {
        socket.end(xutil.simpleHttpResponse(404, {
            Server: constants.ServerName,
            Date: date,
            Connection: "close",
        }));
        return;
    }
    if (new URL(inc.headers["origin"] as string).host != inc.headers.host) {
        socket.end(xutil.simpleHttpResponse(403, {
            Server: constants.ServerName,
            Date: date,
            Connection: "close",
        }));
        return;
    }
    if (inc.headers.connection != "Upgrade" || inc.headers.upgrade != "websocket" ) {
        socket.end(xutil.simpleHttpResponse(406, {
            Server: constants.ServerName,
            Date: date,
            Connection: "close",
        }));
        return;
    }
    let en_ws_key: string = inc.headers["sec-websocket-key"] as string;
    try {
        let ws_key = Buffer.from(en_ws_key || "", 'base64').toString('ascii');
        if(ws_key.length != 16)
            throw new Error("sec-websocket-key fault");
    } catch (err) {
        socket.end(xutil.simpleHttpResponse(406, {
            Server: constants.ServerName,
            Date: date,
            Connection: "close",
        }));
        return;
    }
    if (parseInt(inc.headers["sec-websocket-version"] as string) != 13) {
        socket.end(xutil.simpleHttpResponse(426, {
            Server: constants.ServerName,
            "Sec-WebSocket-Version": 13,
            Date: date,
            Connection: "close",
        }));
        return;
    }
    let cookie__ = xutil.parseCookie(inc.headers.cookie);
    let sid = cookie__ && (cookie__.get("SID") || cookie__.get("sid"));
    let user = conf.LookupUserRootBySID(sid);
    if (user == null) {
        socket.end(xutil.simpleHttpResponse(401, {
            Server: constants.ServerName,
            Date: date,
            Connection: "close",
        }));
        return;
    }
    // Accept
    let response = xutil.simpleHttpResponse(101, {
        Server: constants.ServerName,
        Date: date,
        Upgrade: "websocket",
        Connection: "Upgrade",
        "Sec-WebSocket-Accept": xutil.WebSocketAcceptKey(en_ws_key)
    });
    socket.write(response);
    let ns = new FileControlSession(socket, user);
} //}

/**
 * @class FileControlSession
 * use to control a authenticated session
 */
class FileControlSession //{
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
        this.websocket.on("error", (err: Error) => {
            if (this.invalid) return;
            this.invalid = true;
            debug(`websocket throw exception: ${err}, ${this.invalid}`);
            this.websocket.close(1004);
        });
        this.websocket.on("timeout", () => {
            this.invalid = true;
            debug(`websocket timeout`);
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

    private op_chmod (msg) //{
    {
        let reqid: string = msg["id"];
        let path_: string = msg["path"];
        let mode_: string = msg["mode"];
        if (!util.isString(path_) || !(path_ as string).startsWith("/") ||
            !util.isString(mode_))
            return this.sendfail(reqid, StatusCode.BAD_ARGUMENTS);
        path_ = path.resolve(this.user.DocRoot, path_.substr(1));
        fs.chmod(path_, mode_, (err) => {
            if(err) this.sendfail(reqid, StatusCode.FS_REPORT_ERROR, err.message.toString());
            else    this.sendsuccess(reqid);
        });
    } //}
    private op_copy  (msg) //{
    {
        let reqid: string = msg["id"];
        let src: string = msg["src"] as string;
        let dst: string = msg["dst"] as string;
        if (!util.isString(src) || !(src as string).startsWith("/") ||
            !util.isString(dst) || !(dst as string).startsWith("/"))
            return this.sendfail(reqid, StatusCode.BAD_ARGUMENTS);
        src = path.resolve(this.user.DocRoot, src.substring(1));
        dst = path.resolve(this.user.DocRoot, dst.substring(1));
        fs.copyFile(src, dst, (err) => {
            if(err) this.sendfail(reqid, StatusCode.FS_REPORT_ERROR, err.message.toString());
            else    this.sendsuccess(reqid);
        });
    } //}
    /** execute command, and return a message that contains stdout and stderr of the command */
    private op_exec  (msg) //{
    {
        let reqid: string = msg["id"];
        let path__: string    = msg["path"];
        let argv__:  string[] = msg["argv"] || [];
        if (!util.isString(path__) || !(path__ as string).startsWith("/"))
            return this.sendfail(reqid, StatusCode.BAD_ARGUMENTS);
        path__ = path.resolve(this.user.DocRoot, path__.substring(1));
        child_proc.execFile(path__, argv__, (err, stdout, stderr) => {
            if(err) return this.sendfail(reqid, StatusCode.FS_REPORT_ERROR, err.message.toString());
            this.send(JSON.stringify({
                id: reqid,
                msg: {
                    stdout: stdout,
                    stderr: stderr
                },
                error: false
            }, null, 1));
        });
    } //}
    /** get stat of files under specified directory, the result also includes the directory */
    private op_getdir(msg) //{
    {
        let loc: string = msg["path"];
        let reqid: string = msg["id"];
        if (!util.isString(msg["path"]) || !loc.startsWith("/"))
            return this.sendfail(reqid, StatusCode.BAD_ARGUMENTS);
        let dir: string = path.resolve(this.user.DocRoot, loc.substring(1));
        annautils.fs.getStatsOfFiles(dir, 1, (err, stats) => {
            if(err) return this.sendfail(reqid, StatusCode.FS_REPORT_ERROR, err.message.toString());
            this.current_loc = dir;
            let stats_ = {id: reqid, msg: stats, error: false};
            let user_root = this.user.DocRoot.trim();
            this.send(JSON.stringify(stats_, (k, v) => {
                if(k != "filename") return v;
                if (xutil.pathEqual(v, user_root)) return "/";
                return (v as string).substring(user_root.length - (user_root.endsWith("/") ? 1 : 0));
            }, 1));
        });
        return; 
    } //}
    /** just make a new direcory, if parent path is absent, will return fail */
    private op_mkdir (msg) //{
    {
        let loc: string = msg["path"];
        let reqid: string = msg["id"];
        if (!util.isString(msg["path"]) || !loc.startsWith("/"))
            return this.sendfail(reqid, StatusCode.BAD_ARGUMENTS);
        let dir: string = path.resolve(this.user.DocRoot, loc.substring(1));
        fs.mkdir(dir, {recursive: true}, (err, path) => {
            if(err) this.sendfail(reqid, StatusCode.FS_REPORT_ERROR, err.message.toString());
            else    this.sendsuccess(reqid);
        });
    } //}
    /** read partial content of file */
    private op_read  (msg) //{
    {
        let loc: string = msg["path"];
        let reqid: string = msg["id"];
        if (!util.isString(msg["path"]) || !loc.startsWith("/"))
            return this.sendfail(reqid, StatusCode.BAD_ARGUMENTS);
        let dir: string = path.resolve(this.user.DocRoot, loc.substring(1));
        let offset: number = parseInt(msg["offset"]);
        let length: number = parseInt(msg["length"]);
        if (!util.isNumber(offset) || !util.isNumber(length) || offset < 0 || length < 0)
            return this.sendfail(reqid, StatusCode.BAD_ARGUMENTS);
        fs.open(dir, "r", (err, fd) => {
            if(err) return this.sendfail(reqid, StatusCode.FS_REPORT_ERROR, err.message.toString());
            let buf = Buffer.alloc(length);
            let ll = length;
            fs.read(fd, buf, 0, ll, offset, (err, n, b) => {
                if(err) return this.sendfail(reqid, StatusCode.FS_REPORT_ERROR, err.message.toString());
                fs.close(fd, (err) => {if (err) debug(`close file [${dir}] error`);});
                let bb;
                if(n == length)
                    bb = buf;
                else {
                    console.log("asdf", n);
                    bb = Buffer.alloc(n);
                    buf.copy(bb, 0, 0, n);
                }
                // Due to simplicity using hex, but double the traffic, FIXME
                return this.send(JSON.stringify({id: reqid, msg: bb.toString("hex"), error: false}, null, 1));
            });
        });
    } //}
    /** similar with [rm -rf], so be careful */
    private op_remove(msg) //{
    {
        let loc: string = msg["path"];
        let reqid: string = msg["id"];
        if (!util.isString(msg["path"]) || !loc.startsWith("/"))
            return this.sendfail(reqid, StatusCode.BAD_ARGUMENTS);
        let dir: string = path.resolve(this.user.DocRoot, loc.substring(1));
        annautils.fs.removeRecusive(dir, (err) => {
            if(err) this.sendfail(reqid, StatusCode.FS_REPORT_ERROR, err.message.toString());
            else    this.sendsuccess(reqid);
        });
        return; 
    } //}
    /** move */
    private op_rename(msg) //{
    {
        let reqid: string = msg["id"];
        let src: string = msg["src"] as string;
        let dst: string = msg["dst"] as string;
        if (!util.isString(src) || !src.startsWith("/") ||
            !util.isString(dst) || !dst.startsWith("/"))
            return this.sendfail(reqid, StatusCode.BAD_ARGUMENTS);
        src = path.resolve(this.user.DocRoot, src.substring(1));
        dst = path.resolve(this.user.DocRoot, dst.substring(1));
        fs.rename(src, dst, (err) => {
            if(err) this.sendfail(reqid, StatusCode.FS_REPORT_ERROR, err.message.toString());
            else    this.sendsuccess(reqid);
        });
    } //}
    /** stat a specified file */
    private op_stat  (msg) //{
    {
        let loc: string = msg["path"];
        let reqid: string = msg["id"];
        if (!util.isString(msg["path"]) || !loc.startsWith("/"))
            return this.sendfail(reqid, StatusCode.BAD_ARGUMENTS);
        let dir: string = path.resolve(this.user.DocRoot, loc.substring(1));
        fs.stat(dir, (err, stats) => {
            if(err) return this.sendfail(reqid, StatusCode.FS_REPORT_ERROR, err.message.toString());
            stats["filename"] = dir;
            if (stats.isBlockDevice()) {
                stats["type"] = "block";
            } else if (stats.isDirectory()) {
                stats["type"] = "dir";
            } else if (stats.isFile()) {
                stats["type"] = "reg";
            } else if (stats.isCharacterDevice()) {
                stats["type"] = "char";
            } else if (stats.isSymbolicLink()) {
                stats["type"] = "symbol";
            } else if (stats.isFIFO()) {
                stats["type"] = "fifo";
            } else if (stats.isSocket()) {
                stats["type"] = "socket";
            } else {
                stats["type"] = "unknown";
            }
            this.send(JSON.stringify({
                id: reqid,
                error: false,
                msg: stats
            }, null, 1));
        });
    } //}
    /** similar with [touch] */
    private op_touch (msg) //{
    {
        let loc: string = msg["path"];
        let reqid: string = msg["id"];
        if (!util.isString(msg["path"]) || !loc.startsWith("/"))
            return this.sendfail(reqid, StatusCode.BAD_ARGUMENTS);
        let dir: string = path.resolve(this.user.DocRoot, loc.substring(1));
        let cur = new Date();
        fs.open(dir, "a" , (err, fd) => {
            if(err) return this.sendfail(reqid, StatusCode.FS_REPORT_ERROR, err.message.toString());
            fs.futimes(fd, cur, cur, (err) => {
                if(err) return this.sendfail(reqid, StatusCode.FS_REPORT_ERROR, err.message.toString());
                fs.close(fd, (err) => {if (err) debug(`close file [${dir}] error`);});
                return this.sendsuccess(reqid);
            });
        });
    } //}
    /** write content to a range of file, if file doesn't exist, send back a fail message */
    private op_write (msg) //{
    {
        let loc: string = msg["path"];
        let reqid: string = msg["id"];
        if (!util.isString(msg["path"]) || !loc.startsWith("/"))
            return this.sendfail(reqid, StatusCode.BAD_ARGUMENTS);
        let dir: string = path.resolve(this.user.DocRoot, loc.substring(1));
        let offset: number = parseInt(msg["offset"]);
        let buf: Buffer = Buffer.from(msg["buf"], "hex");
        if (!util.isNumber(offset) || offset < 0)
            return this.sendfail(reqid, StatusCode.REQUEST_ERROR);
        fs.open(dir, "r+", (err, fd) => {
            if(err) return this.sendfail(reqid, StatusCode.FS_REPORT_ERROR, err.message.toString());
            fs.write(fd, buf, 0, buf.length, offset, (err, n, b) => {
                if(err) return this.sendfail(reqid, StatusCode.FS_REPORT_ERROR, err.message.toString());
                fs.close(fd, (err) => {if (err) debug(`close file [${dir}] error`);});
                return this.sendsuccess(reqid);
            });
        });
    } //}
    /** truncate file */
    private op_truncate(msg) //{
    {
        let loc: string = msg["path"];
        let reqid: string = msg["id"];
        let len: number = parseInt(msg["length"]);
        if (!util.isString(msg["path"]) || !loc.startsWith("/") || !util.isNumber(len) || len < 0)
            return this.sendfail(reqid, StatusCode.BAD_ARGUMENTS);
        let path_: string = path.resolve(this.user.DocRoot, loc.substring(1));
        fs.truncate(path_, len, (err) => {
            if(err) return this.sendfail(reqid, StatusCode.FS_REPORT_ERROR, err.message.toString());
            return this.sendsuccess(reqid);
        });
    } //}

    private onmessage(msg: Buffer | string) //{
    {
        if(this.invalid) return;
        let what;
        try {
            what = JSON.parse(msg as string);
        } catch (err){
            this.send(err.toString());
        }
        let opc: FileOpcode = what["opcode"];
        let reqid: string   = what["id"];
        if (reqid == null) return this.sendfail("", StatusCode.BAD_ID);
        if (opc   == null) return this.sendfail(reqid, StatusCode.BAD_OPCODE);
        switch (opc) //{
        {
            /** @property {string} what["path"] */
            case FileOpcode.GETDIR: this.op_getdir(what); break;

            /** @property {string} what["src"]
             *  @property {string} what["dst"] */
            case FileOpcode.RENAME: this.op_rename(what); break;

            /** @property {string} what["src"]
             *  @property {string} what["dst"] */
            case FileOpcode.COPY:   this.op_copy(what); break;

            /** @property {string} what["path"] */
            case FileOpcode.REMOVE: this.op_remove(what); break;

            /** @property {string} what["path"] */
            case FileOpcode.MKDIR: this.op_mkdir(what); break;

            /** @property {string} what["path"] */
            case FileOpcode.TOUCH: this.op_touch(what); break;

            /** @property {string} what["path"]
                @property {number} what["len"] */
            case FileOpcode.TRUNCATE: this.op_truncate(what); break;

            /** @property {string} what["path"] */
            case FileOpcode.STAT:  this.op_stat(what); break;

           /** @property {string} what["path"]
             * @property {string} what["mode"] */
            case FileOpcode.CHMOD: this.op_chmod(what); break;

            /** @property {string}   what["path"] *
             *  @property {string[]} what["args"] */
            case FileOpcode.EXECUTE: this.op_exec(what); break;

            case FileOpcode.READ: this.op_read(what); break;
            case FileOpcode.WRITE: this.op_write(what); break;

            case FileOpcode.INVALID:
                debug(`get error request ${what["opcode"]}`);
                return this.sendfail(reqid, StatusCode.BAD_OPCODE);
        } //}
    } //}

    private sendfail(id: string, code: StatusCode = StatusCode.FAIL, reason: string = null) {
        let msg = {id: id, msg: reason ? {message: reason, code: code} : statusCodeToJSON(code), error: true};
        this.send(JSON.stringify(msg, null, 1));
    }

    private sendsuccess(id: string, code: StatusCode = StatusCode.SUCCESS) {
        let msg = {id: id, msg: statusCodeToJSON(code), error: false};
        this.send(JSON.stringify(msg, null, 1));
    }
} //}

