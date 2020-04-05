/* WEB DISK */

/*
 * A simple http server, provide basic authenticated function and return resources
 * ONLY handle GET method and HEADER method
 */

import * as event from 'events';
import * as net   from 'net';
import * as http  from 'http';
import * as proc  from 'process';
import * as fs    from 'fs';
import * as path  from 'path';
import * as utilx from 'util';
import * as stream from 'stream';
import * as pathx from 'path';

import * as smartbuffer from 'smart-buffer';

import { ServerConfig } from './server_config';
import { URL }          from 'url';
import * as util        from './util';
import * as constants   from './constants';
import * as parser      from './parse_html_inlinejs';

import * as annautils from 'annautils';

const disk_prefix: string = "/disk";

class BufferStream extends stream.Writable {
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
        
        if (utilx.isString(chunk)) {
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
}

/* events
 * |> configParsed
 * |> configWrited
 * |> request
 * |> listening
 * |> close
 * |> error
 */
export class HttpServer extends event.EventEmitter {
    private config: ServerConfig;
    private httpServer: http.Server;

    constructor (configFile: string) {
        super();
        this.config = new ServerConfig(configFile);
        this.httpServer = new http.Server();

        this.httpServer.on("request", (req, res) => this.emit("request", req, res));
        this.httpServer.on("close", ()  => this.emit("close"));
        this.httpServer.on("error", err => this.emit("error", err));
        this.httpServer.on("listening", () => this.emit("listening"));

        this.on("request", this.onrequest);
    }

    private write_empty_response(res: http.ServerResponse, sc: number = 405) {
        res.statusCode = sc;
        res.end();
    }

    private async write_file_response(path: string, res: http.ServerResponse, header: boolean, range: [number, number] = null) //{
    {
        if (path == null) {
            res.statusCode = 500;
            res.end("<h1>Internal Server Error</h1>");
        }
        let success: number = 200;
        if (range) success = 206;
        try {
            let astat = utilx.promisify(fs.stat);
            let filestat = await astat(path);
            if (!filestat.isFile)
                throw new Error("file doesn't exist");
            if (range != null && filestat.size <= range[1]) 
                throw new Error("request range is out of the file");
            let content_length: number;
            let startposition: number;
            if (range == null) {
                content_length = filestat.size;
                startposition = 0;
            } else if (range[1] == -1) {
                content_length = filestat.size - range[0];
                startposition = range[0];
            } else {
                content_length = range[1] - range[0] + 1;
                startposition = range[0];
            }
            res.setHeader("Accept-Ranges", "bytes");
            res.setHeader("Content-Length", content_length);
            let file_extension: string = pathx.extname(path);
            let content_type: string   = constants.FILE_TYPE_MAP.get(file_extension) || constants.FILE_TYPE_MAP.get("unknown");
            res.setHeader("Content-Type", content_type);
            res.setHeader("Last-Modified", filestat.mtime.toUTCString());
            if(range != null) {
                if (range[1] != -1)
                    res.setHeader("Content-Range", `bytes ${range[0]}-${range[1]}/${filestat.size}`);
                else
                    res.setHeader("Content-Range", `bytes ${range[0]}-${filestat.size - 1}/${filestat.size}`);
            }
            res.statusCode = success;
            if (header) {
                res.end();
                return;
            }
            fs.open(path, "r", (err, fd) => {
                if (err) {
                    res.writeHead(500);
                    return res.end();
                }
                res.writeHead(success);
                util.fwriteToWritable(fd, startposition, res, content_length, 1024, false, (err, nbytes) => {
                    if (err != null) {
                        res.statusCode = 500;
                        return res.end();
                    }
                    res.end();
                });
            });
        } catch (err) {
            res.statusCode = 404;
            res.end(`<h1>${err}</h1>`);
            return;
        }
    } //}

    protected onrequest(request: http.IncomingMessage, response: http.ServerResponse) //{
    {
        response.setHeader("Server", "webdisk/0.0.1");
        if (request.method.toLowerCase() != "get" && request.method.toLowerCase() != "header") {
            this.write_empty_response(response);
            return;
        }
        let header: boolean = request.method.toLowerCase() == "header";
        let url = new URL(request.url, `http:\/\/${request.headers.host}`);
        if(url.pathname.startsWith(disk_prefix)) { // RETURN FILE
            if (request.headers.cookie == null || request.headers.cookie == "")
                return this.write_empty_response(response, 401);
            let sid_pair = request.headers.cookie.split("=");
            if (sid_pair[0] != "SID" || sid_pair[1] == null)
                return this.write_empty_response(response, 401);
            let user = this.config.LookupUserRootBySID(request.headers.cookie);
            if (user == null)
                return this.write_empty_response(response, 401);
            let docRoot = user.DocRoot;
            let LID = url.searchParams.get("lid");
            if (LID == null || user["LID"] != LID)
                return this.write_empty_response(response, 401);
            let fileName = path.resolve(docRoot, url.pathname.substring(1));
            let range: [number, number] = util.parseRangeField(request.headers.range);
            response.removeHeader("Connection");
            this.write_file_response(fileName, response, header, range);
        } else { // JUST SINGLE PAGE "/index.html" or "/", PUBLIC Resources
            if (url.pathname == "/") url.pathname = "/index.html";
            let fileName = path.resolve(constants.WebResourceRoot, url.pathname.substring(1));
            if (!fileName.endsWith(".html")) {
                response.removeHeader("Connection");
                return this.write_file_response(fileName, response, header, util.parseRangeField(request.headers.range));
            }
            fs.stat(fileName, (err, stat) => {
                if (err)
                    return this.write_empty_response(response, 404);
                response.statusCode = 200;
                response.setHeader("content-type", "text/html");
                if (header) return response.end();
                parser.parseHTMLNewProc(fileName, 
                    {REQ: util.httpRequestToAcyclic(request), CONFIG: this.config},
                    response, null, (err_) => {
                        if(err_) return this.write_empty_response(response, 404);
                        response.end();
                    });
            });
        }
    } //}

    private __listen(port: number, addr: string) {
        if (!this.config.parsed()) this.emit("error", new Error("config file need be parsed before listen"));
        this.httpServer.listen(port, addr);
    }

    public listen(port: number, addr: string) //{
    {
        if (!this.config.parsed()) {
            this.config.ParseFile((err) => {
                if (err) throw err;
                this.emit("configParsed")
                this.__listen(port, addr);
            });
        } else 
            this.__listen(port, addr);
    } //}
};
