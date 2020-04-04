/* WEB DISK */

/*
 * A simple http server, provide basic authenticated function and return resources
 * ONLY handle GET method and HEADER method
 */

import * as event from 'events';
import * as net   from 'net';
import * as http  from 'http';
import * as fs    from 'fs';

import * as util from './util';

import { ServerConfig } from './server_config';
import { URL }          from 'url';

interface IHttpServer
{
    listen(port: number, addr: string): void;
    close(): void;
    onrequest(socket: net.Socket);
};

const disk_prefix: string = "/disk";

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
        this.config.ParseFile((err) => {
            if (err) throw err;
            this.emit("configParsed")
        });

        this.httpServer.on("request", (req, res) => this.emit("request", req, res));
        this.httpServer.on("close", () => this.emit("close"));
        this.httpServer.on("error", err => this.emit("error", err));
        this.httpServer.on("listening", () => this.emit("listening"));

        this.on("request", this.onrequest);
    }

    private write_empty_response(res: http.ServerResponse) {
        res.statusCode = 405;
        res.end();
    }

    private async write_file_response(path: string, res: http.ServerResponse, header: boolean, range: [number, number] = null) //{
    {
        if (path == null) {
            res.statusCode = 500;
            res.end("<h1>Internal Server Error</h1>");
        }
        try {
            let filestat = await fs.promises.stat(path);
            if (!filestat.isFile) 
                throw new Error("file doesn't exist");
            if (range != null && filestat.size <= range[1]) 
                throw new Error("request range is out of the file");
            let content_length: number;
            let startposition: number;
            if (range == null) {
                content_length = filestat.size;
                startposition = 0;
            } else {
                content_length = range[1] - range[0] + 1;
                startposition = range[0];
            }
            res.setHeader("Accept-Range", "bytes");
            res.setHeader("Content-Length", content_length);
            if(range != null)
                res.setHeader("Content-Range", `bytes ${range[0]}-${range[1]}/${content_length}`);
            if (header) {
                res.statusCode = 200;
                res.end();
                return;
            }
            util.writeToWritable(path, startposition, res, content_length, 1024, true, (err, nbytes) => {
                if (err != null)
                    res.statusCode = 500;
                else 
                    res.statusCode = 200;
                return res.end();
            });
        } catch (err) {
            res.statusCode = 404;
            res.end(`<h1>${err}</h1>`);
            return;
        }
    } //}

    onrequest(request: http.IncomingMessage, response: http.ServerResponse) {
        if (request.method.toLowerCase() != "get" || request.method.toLowerCase() != "header") {
            this.write_empty_response(response);
            return;
        }
        let url = new URL(request.url, `http://${request.headers.host}`);
        if(url.pathname.startsWith(disk_prefix)) { // RETURN FILE
        }
    }

    listen(port: number, addr: string) {
        if (!this.config.parsed()) this.emit("error", new Error("config file need be parsed before listen"));
        this.httpServer.listen(port, addr);
    }
};
