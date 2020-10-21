/* WEB DISK */

/*
 * A simple http server, provide basic authenticated function and return resources
 * ONLY handle GET method and HEADER method
 */

import * as event from 'events';
import * as net   from 'net';
import * as http  from 'http';
import * as fs    from 'fs';
import * as path  from 'path';
import * as utilx from 'util';
import * as pathx from 'path';

import { URL }          from 'url';
import * as util        from './util';
import * as constants   from './constants';

import { upgradeHandler } from './file_server';
import { debug, info, warn, error } from './logger';

import * as annautils from 'annautils';


/**
 * @class HttpServer delegate of underlying http server
 * @event request
 * @event upgrade
 * @event listening
 * @event close
 * @event error
 */
export class HttpServer extends event.EventEmitter //{
{
    private httpServer: http.Server;

    /**
     * @param {string} configFile a json file that specify configuration of this server, such as users information
     */
    constructor () //{
    {
        super();
        this.httpServer = new http.Server();

        this.httpServer.on("request", (req, res) => this.emit("request", req, res));
        this.httpServer.on("upgrade", (inc, sock, buf) => this.emit("upgrade", inc, sock, buf));
        this.httpServer.on("close", ()  => this.emit("close"));
        this.httpServer.on("error", err => this.emit("error", err));
        this.httpServer.on("listening", () => this.emit("listening"));

        this.on("request", this.onrequest);
        this.on("upgrade", this.onupgrade);
    } //}

    /** response client with nothing, default status code is 405, methold not allow */
    private write_empty_response(res: http.ServerResponse, sc: number = 405) //{
    {
        res.statusCode = sc;
        res.end();
    } //}

    /** 
     * response a file or partial file that is in server to client, 
     * if whole file status code is [200 OK], if partial file status code is [206 partial content]
     * @param { string } path file path
     * @param { ServerResponse } res response stream
     * @param { boolean } header if true just response with HTTP header
     * @param { [number, number] } range range of file, null represent whole file
     */
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
                annautils.stream.fdWriteToWritable(fd, startposition, res, content_length, 1024, false, (err, nbytes) => {
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

    /** default listener of request event */
    protected onrequest(request: http.IncomingMessage, response: http.ServerResponse) //{
    {
        response.setHeader("Server", constants.ServerName);
        let url = new URL(request.url, `http:\/\/${request.headers.host}`);
        if (request.method.toLowerCase() != "get" && request.method.toLowerCase() != "header") {
            response.statusCode = 405;
            response.setHeader("Connection", "close");
            response.end();
        }
        let header: boolean = request.method.toLowerCase() == "header";
        if(url.pathname.startsWith(constants.DISK_PREFIX)) { // RETURN FILE
            // TODO DATABASE
            let sid = url.searchParams.get("sid");
            if (sid == null)
                return this.write_empty_response(response, 401);
            // TODO FIXME
            let user = null;
            if (user == null)
                return this.write_empty_response(response, 401);
            let docRoot = user.DocRoot;
            let fileName = path.resolve(docRoot, decodeURI(url.pathname.substring(constants.DISK_PREFIX.length + 1)));
            let range: [number, number] = util.parseRangeField(request.headers.range);
            this.write_file_response(fileName, response, header, range);
        } else { // JUST SINGLE PAGE "/index.html" or "/", PUBLIC Resources
            if (url.pathname == "/") url.pathname = "/index.html";
            let fileName = path.resolve(constants.WebResourceRoot, url.pathname.substring(1));
            return this.write_file_response(fileName, response, header, util.parseRangeField(request.headers.range));
        }
    } //}

    /** default listener of request event */
    protected onupgrade(inc: http.IncomingMessage, socket: net.Socket, buf: Buffer) //{
    {
        upgradeHandler(inc, socket, buf);
    } //}
    /** listen */
    public listen(port: number, addr: string) //{
    {
        this.httpServer.listen(port, addr);
    } //}
}; //}

