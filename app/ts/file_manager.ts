import * as constants from './constants';
import { File, WS } from './global_vars';
import { EventEmitter } from 'events';
import * as util from './util';

import { debug } from './util';

enum FileOpcode {
    CHMOD   = "chmod",
    COPY    = "copy",
    EXECUTE = "execute",
    GETDIR  = "getdir",
    INVALID = "invalid",
    MKDIR   = "mkdir",
    READ    = "read",
    REMOVE  = "remove",
    RENAME  = "rename",
    STAT    = "stat",
    TOUCH   = "touch",
    TRUNCATE = "truncate",
    WRITE   = "write",
};

type FileOpCallback = (err: Error, data: any) => void;

/**
 * @class FileManager
 * Provide function call to manage remote file system
 * @event error
 *     @param {Error}
 * @event unknown @fires when recieve message whose id can't match previously sended message
 *     @param {any} the whole message
 * @event parseError @fires when parsing incoming message as JSON occur error
 *     @param {Error}
 * @event ready @fires when ws state changes to OPEN
 */
export class FileManager extends EventEmitter //{
{
    /**
     * @property {Websocket} connection underlying websocket connection
     * @wait_list {Map} when recieve message from server
     */
    private connection: WebSocket;
    private wait_list: Map<string, [FileOpcode, FileOpCallback]>;
    private timeout_ms: number;

    constructor(connection: WebSocket) //{
    {
        super();
        this.timeout_ms = 3000;
        this.connection = connection;
        this.setup_new_connection();
    } //}

    private setup_new_connection() //{
    {
        if (this.connection == null || this.connection.readyState == WebSocket.CLOSED) {
            this.emit("error", new Error("invalid socket"));
            this.connection = null;
        }
        this.wait_list = new Map<string, [FileOpcode, FileOpCallback]>();
        this.connection.onmessage = (msg) => {this.onmessage(msg);}
        this.connection.onclose = () => {this.emit("close"); this.connection = null;}
        this.connection.onerror = (err) => {this.emit("error"); this.connection = null;}
        this.connection.onopen = () => {this.emit("ready"); console.log("open new websocket");}
    } //}

    get Timeout() {return this.timeout_ms;}
    set Timeout(ms: number) {this.timeout_ms = ms;}

    private register_timeout(id) //{
    {
        window.setTimeout(() => {
            let mm = this.wait_list.get(id);
            if(mm != null) {
                debug(`timeout for id ${id}`);
                mm[1].call(null, new Error("timeout"), null);
                this.wait_list.set(id, [FileOpcode.INVALID, null]);
            }
        }, this.timeout_ms);
    } //}
    private ready(): boolean {return this.connection && (this.connection.readyState == WebSocket.OPEN);}
    private valid(): boolean {return this.connection && (this.connection.readyState != WebSocket.CLOSED);}
    private newid(): string {return util.makeid(16);}

    private onmessage(msg: MessageEvent): void //{
    {
        let data = msg.data;
        let parsed_msg;
        try {
            parsed_msg = JSON.parse(data);
        } catch (err) {
            this.emit("parseError", data);
            return;
        }
        let id = parsed_msg["id"];
        let xx = this.wait_list.get(id || this.newid());
        if (xx == null) {
            this.emit("unknown", parsed_msg);
            return;
        }
        this.wait_list.delete(id);
        if(xx[0] == FileOpcode.INVALID) // operation timeout
            return;
        if (xx[1] == null) return;
        xx[1].apply(null, [parsed_msg["error"] ? new Error((parsed_msg["msg"] && parsed_msg["msg"]["message"]) || "request error") : null, parsed_msg["msg"]]);
    } //}

    private operation(opcode: FileOpcode, req: any, cb: FileOpCallback) //{
    {
        if (!this.ready()) cb(new Error("socket error"), null);
        let id = this.newid();
        this.register_timeout(id);
        this.wait_list.set(id, [opcode, cb]);
        req["id"] = id;
        req["opcode"] = opcode;
        this.connection.send(JSON.stringify(req, null, 1));
    } //}
    chmod(loc: string, mode: string, cb: FileOpCallback = this.echoMsg) {this.operation(FileOpcode.CHMOD, {path: loc, mode: mode}, cb);}
    copy(src: string, dst: string, cb: FileOpCallback = this.echoMsg) {this.operation(FileOpcode.COPY, {src: src, dst: dst}, cb);}
    exec(loc: string, argv: string[], cb: FileOpCallback = this.echoMsg) //{
    {
        this.operation(FileOpcode.EXECUTE, {
            path: loc,
            argv: argv
        }, cb);
    } //}
    getdir(loc: string, cb: FileOpCallback = this.echoMsg) {this.operation(FileOpcode.GETDIR, {path: loc}, cb);}
    mkdir(loc: string, cb: FileOpCallback = this.echoMsg) {this.operation(FileOpcode.MKDIR, {path: loc}, cb);}
    read(loc: string, offset: number, length: number, cb: FileOpCallback = this.echoMsg) //{
    {
        this.operation(FileOpcode.READ, {
            path: loc,
            offset: offset,
            length: length
        }, cb);
    } //}
    rename(src: string, dst: string, cb: FileOpCallback = this.echoMsg) {this.operation(FileOpcode.RENAME, {src: src, dst: dst}, cb);}
    remove(loc: string, cb: FileOpCallback = this.echoMsg) {this.operation(FileOpcode.REMOVE, {path: loc}, cb);}
    stat(loc: string, cb: FileOpCallback = this.echoMsg) {this.operation(FileOpcode.STAT, {path: loc}, cb);} // TODO
    touch(loc: string, cb: FileOpCallback = this.echoMsg) {this.operation(FileOpcode.TOUCH, {path: loc}, cb);}
    truncate(loc: string, len: number, cb: FileOpCallback = this.echoMsg) {this.operation(FileOpcode.TRUNCATE, {path: loc, length: len}, cb);}
    write(loc: string, offset: number, hexbuf: string, cb: FileOpCallback = this.echoMsg) //{
    {
        this.operation(FileOpcode.WRITE, {
            path: loc,
            offset: offset,
            buf: hexbuf 
        }, cb);
    } //}

    reset(ws: WebSocket) {
        this.connection = ws;
        this.setup_new_connection();
        this.emit("reset");
    }

    private echoMsg(err, msg) {
        debug(msg);
        if(err) throw err;
    }
}; //}

export function SetupFM() {
    File.manager = new FileManager(WS.WebsocketConnection);
    window["fm"] = File.manager;
}
