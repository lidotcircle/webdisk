import * as constants from './constants';
import { File, WS } from './global_vars';
import { EventEmitter } from 'events';
import * as util from './util';
import * as types from './types';

import { debug, promisify } from './util';

import { FileOpcode } from '../../lib/common';


type Success = {code: number, message: string};
type FileEntry = {file: string};
type DirectoryEntry = {dir: string};
type RangesEntry = [number, number][];
type FileOpCallback = (err: Error, data: any) => void;
const minimum_retry_time = 100;
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
     * @property {Map} wait_list when recieve message from server
     * @property {number} timeout_ms how long to wait server responses a message
     * @property {string} serverURI ws url
     */
    private connection: WebSocket;
    private wait_list: Map<string, [FileOpcode, FileOpCallback]>;
    private timeout_ms: number;
    private serverURI: string;
    private retry: boolean;
    private exp_time_ms: number;

    /**
     * @param {WebSocket} connection websocket connection
     * @param {boolean}   retryOnClose whether retrying connection to server when connection closed 
     */
    constructor(connection: WebSocket, retryOnClose: boolean = false) //{
    {
        super();
        this.timeout_ms = 3000;
        this.connection = connection;
        this.serverURI = connection.url;
        this.retry = retryOnClose;
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
        this.connection.onclose = () => {
            debug("ws closed");
            this.emit("close"); this.connection = null;
            if (this.retry) { // try to reestablishing websocket connection
                window.setTimeout(() => {
                    debug(`try to reconnect to ${this.serverURI}`);
                    this.connection = new WebSocket(this.serverURI);
                    this.setup_new_connection();
                }, this.exp_time_ms);
                this.exp_time_ms *= 2;
            }
        }
        this.connection.onerror = (err) => {
            debug("ws error");
            this.emit("error", err); this.connection = null;
        }
        this.connection.onopen = () => {
            debug("ws oponed");
            this.exp_time_ms = minimum_retry_time;
            this.emit("ready");
        }
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
    private newid(): string  {return util.makeid(16);}

    /**
     * The type of message data is string or buffer, if it is string, 
     * it should be a json string in such format {
     *     id: string, 
     *     msg: JSONMsg, 
     *     error: boolean
     * }
     * When JSON.parse the string raise an error or parsed message doesn't contains
     * above fields, just abort this message and emit an parseError event with original
     * message as first parameter.
     * If the error field is true, then the msg should be {code: number, reason: string} format,
     * otherwise the msg depends on the opcode.
     * @param {MessageEvent} msge message recieved from websocket
     */
    private onmessage(msge: MessageEvent): void //{
    {
        let data = msge.data;
        let parsed_msg;
        try {
            parsed_msg = JSON.parse(data);
        } catch (err) {
            this.emit("parseError", data);
            return;
        }
        if (parsed_msg["id"] == null || parsed_msg["msg"] == null || parsed_msg["error"] == null) {
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
        let err: Error;
        if(parsed_msg["error"])
            err = new Error(parsed_msg["msg"]["message"] || "Request error, server doesn't provide reason");
        xx[1].call(null, err, parsed_msg["msg"]);
    } //}

    /** remote function calls, serialization with JSON */
    // RPC JSON //{
    private operation(opcode: FileOpcode, req: any, cb: FileOpCallback) //{
    {
        if (!this.ready()) cb(new Error("websocket isn't ready"), null);
        let id = this.newid();
        this.register_timeout(id);
        this.wait_list.set(id, [opcode, cb]);
        req["id"] = id;
        req["opcode"] = opcode;
        this.connection.send(JSON.stringify(req, null, 1));
    } //}
    chmod(loc: string, mode: string, cb: FileOpCallback = this.echoMsg) {this.operation(FileOpcode.CHMOD, {path: loc, mode: mode}, cb);}
    copy(src: string, dst: string, cb: FileOpCallback = this.echoMsg) {this.operation(FileOpcode.COPY, {src: src, dst: dst}, cb);}
    copyr(src: string, dst: string, cb: FileOpCallback = this.echoMsg) {this.operation(FileOpcode.COPYR, {src: src, dst: dst}, cb);}
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
    stat(loc: string, cb: FileOpCallback = this.echoMsg) {this.operation(FileOpcode.STAT, {path: loc}, cb);}
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
    newfile(dir: string, cb: FileOpCallback = this.echoMsg) {this.operation(FileOpcode.NEW_FILE, {path: dir}, cb);}
    newfolder(dir: string, cb: FileOpCallback = this.echoMsg) {this.operation(FileOpcode.NEW_FOLDER, {path: dir}, cb);}
    upload(loc: string, size: number, cb: FileOpCallback = this.echoMsg){this.operation(FileOpcode.UPLOAD, {path: loc, size: size}, cb);}
    upload_write(loc: string, filesize: number, buf: string, offset: number, cb: FileOpCallback = this.echoMsg){this.operation(FileOpcode.UPLOAD_WRITE, {path: loc, buf: buf, size: filesize, offset: offset}, cb);}
    upload_merge(loc: string, size: number, cb: FileOpCallback = this.echoMsg){this.operation(FileOpcode.UPLOAD_MERGE, {path: loc, size: size}, cb);}

    async chmodP   (loc: string, mode: string): Promise<Success>{return promisify(this.chmod).call(this, loc, mode);}
    async copyP    (src: string, dst: string): Promise<Success> {return promisify(this.copy).call(this, src, dst);}
    async copyrP   (src: string, dst: string): Promise<Success> {return promisify(this.copyr).call(this, src, dst);}
    async execP    (loc: string, argv: string[])                {return promisify(this.exec).call(this, loc, argv);}
    async getdirP  (loc: string): Promise<types.FileStat[]>     {return promisify(this.getdir).call(this, loc);}
    async mkdirP   (loc: string): Promise<DirectoryEntry>              {return promisify(this.mkdir).call(this, loc);}
    async readP    (loc: string, offset: number, length: number): Promise<string> {
        return promisify(this.read).call(this, loc, offset, length);
    }
    async renameP  (src: string, dst: string): Promise<Success> {return promisify(this.rename).call(this, src, dst);}
    async removeP  (loc: string): Promise<Success>              {return promisify(this.remove).call(this, loc);}
    async statP    (loc: string): Promise<types.FileStat>       {return promisify(this.stat).call(this, loc);}
    async touchP   (loc: string): Promise<FileEntry>              {return promisify(this.touch).call(this, loc);}
    async truncateP(loc: string, len: number): Promise<Success> {return promisify(this.truncate).call(this, loc, len);}
    async writeP   (loc: string, offset: number, hex: string): Promise<Success> {
        return promisify(this.write).call(this, loc, offset, hex);
    }
    async newfileP  (dir: string): Promise<FileEntry> {return promisify(this.newfile).call(this, dir);}
    async newfolderP(dir: string): Promise<DirectoryEntry> {return promisify(this.newfolder).call(this, dir);}
    async uploadP(loc: string, size: number): Promise<RangesEntry> {return promisify(this.upload).call(this, loc, size);}
    async upload_writeP(loc: string, filesize: number, buf: string, offset: number): Promise<Success> {return promisify(this.upload_write).call(this, loc, filesize, buf, offset);}
    async upload_mergeP(loc: string, size: number): Promise<Success> {return promisify(this.upload_merge).call(this, loc, size);}
    //}

    /** alternatives of above functions, seraialization with raw buffer, it's useful to send file */
    // RPC Buffer //{
    private operation_b(opcode: FileOpcode, req: any, extra: ArrayBuffer, cb: FileOpCallback) //{
    {
        if (!this.ready()) cb(new Error("websocket isn't ready"), null);
        let id = this.newid();
        this.register_timeout(id);
        this.wait_list.set(id, [opcode, cb]);
        req["id"] = id;
        req["opcode"] = opcode;
        let header: ArrayBuffer = util.EncodePairs(req);
        let send_data = util.concatArrayBuffers(header,extra);
        this.connection.send(send_data);
    } //}
    upload_write_b(loc: string, filesize: number, buf: ArrayBuffer, offset: number, cb: FileOpCallback = this.echoMsg) {
        this.operation_b(FileOpcode.UPLOAD_WRITE_B, {path: loc, size: filesize, offset: offset}, buf, cb);
    }

    async upload_write_b_P(loc: string, filesize: number, buf: ArrayBuffer, 
                           offset: number, cb: FileOpCallback = this.echoMsg): Promise<Success> {
        return promisify(this.upload_write_b).call(this, loc, filesize, buf, offset);
    }
    //}

    reset(ws: WebSocket, retryOnClose: boolean = false) {
        this.connection = ws;
        this.retry = retryOnClose;
        this.serverURI = this.connection.url;
        this.setup_new_connection();
        this.emit("reset");
    }

    close(code: number = null) {
        this.retry = false;
        this.connection.close(code);
        this.connection = null;
    }

    private echoMsg(err, msg) {
        debug(msg);
        if(err) throw err;
    }
}; //}

export function SetupFM() {
    File.manager = new FileManager(new WebSocket(constants.server_ws), true);
    window["fm"] = File.manager;
    window["util"] = util;
}
