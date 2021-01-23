/* WEB DISK */

import * as net   from 'net';
import * as fs    from 'fs';
import * as path  from 'path';
import * as http  from 'http';
import * as utilx from 'util';

import { URL }       from 'url';

import * as util     from './utils';
import { constants } from './constants';
import { upgradeHandler } from './message_gateway';

import { debug, info, warn, error } from './logger';
import { DB } from './services';

import * as annautils from 'annautils';
import { cons } from './utils';
import { UserInfo } from './common/db_types';
import { SimpleHttpServer, simpleURL } from './simple_http_server';

/** 
 * response a file or partial file that is in server to client, 
 * if whole file status code is [200 OK], if partial file status code is [206 partial content]
 * @param { string } filename file path
 * @param { ServerResponse } res response stream
 * @param { [number, number] } range range of file, null represent whole file
 */
async function write_file_response(filename: string,         //{
                                   res: http.ServerResponse, 
                                   range: [number, number], 
                                   options: {
                                       attachment?: boolean,
                                       head?: boolean,
                                   })
{
    if (filename == null) {
        res.statusCode = 500;
        res.end("<h1>Internal Server Error</h1>");
    }
    let success: number = 200;
    if (range) success = 206;
    try {
        let astat = utilx.promisify(fs.stat);
        let filestat = await astat(filename);
        if (!filestat.isFile)
            throw new Error("file doesn't exist");
        if (range != null && filestat.size <= range[1]) 
            throw new Error("request range is out of the file");

        if(options.attachment) {
            const bname = path.basename(filename);
            let attachment = `attachment; filename*=UTF-8''${encodeURI(bname)}`;
            res.setHeader('Content-Disposition', attachment);
        }

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
        let file_extension: string = path.extname(filename);
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
        if (options.head) {
            res.end();
            return;
        }
        fs.open(filename, "r", (err, fd) => {
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

function write_empty_response(res: http.ServerResponse, sc: number = 405) //{
{
    res.statusCode = sc;
    res.end();
} //}

export class HttpServer extends SimpleHttpServer
{
    private clipcontent: string | Buffer = null;
    constructor () //{
    {
        super();

        this.on("upgrade", this.onupgrade);
    } //}

    @simpleURL(cons.DiskPrefix + '/.+')
    private async diskFile(request: http.IncomingMessage, url: URL, response: http.ServerResponse) //{
    {
        const head: boolean = request.method.toLowerCase() == "head";

        const token = url.searchParams.get(cons.DownloadTokenName);
        const stoken = url.searchParams.get(cons.DownloadShortTermTokenName);
        if (token == null && stoken == null) {
            return write_empty_response(response, 401);
        }
        const download = async (uinfo: UserInfo) => {
            if (uinfo == null) {
                return write_empty_response(response, 401);
            }
            let fileName = path.resolve(uinfo.rootPath, decodeURI(url.pathname.substring(cons.DiskPrefix.length + 1)));
            let range: [number, number] = util.parseRangeField(request.headers.range);
            await write_file_response(fileName, response, range, {head: head});
        };
        if (!!token) {
            await download(await DB.getUserInfo(token));
        } else {
            await download(await DB.UserInfoByShortTermToken(stoken));
        }
    } //}

    @simpleURL(cons.NamedLinkPREFIX + '/:link')
    private async namedLinkFile(request: http.IncomingMessage, url: URL, response: http.ServerResponse, params: {link: string}) //{
    {
        const head: boolean = request.method.toLowerCase() == "head";
        const range: [number, number] = util.parseRangeField(request.headers.range);

        const namedlink = params.link;
        if(namedlink == null) {
            throw new Error('bad http request dispatch, abort');
        }

        try {
            const user = await DB.queryValidNameEntry(namedlink);
            const filename = path.resolve(user.userinfo.rootPath, user.destination.substr(1));
            await write_file_response(filename, response, range, {head: head, attachment: true});
        } catch (err) {
            debug(err.message);
            response.statusCode = 405;
            response.setHeader("Connection", "close");
            response.end();
        }
    } //}

    @simpleURL('/.*')
    private async defaultURL(request: http.IncomingMessage, url: URL, response: http.ServerResponse) //{
    {
        if(url.pathname == '/') url.pathname = '/index.html';
        const filename  = path.resolve(constants.WebResourceRoot, url.pathname.substring(1));
        const indexfile = path.resolve(constants.WebResourceRoot, 'index.html');
        const head: boolean = request.method.toLowerCase() == "head";
        const range: [number, number] = util.parseRangeField(request.headers.range);

        await this.responseNonPriviledgedFile(response, filename, indexfile, head, range);
    } //}

    @simpleURL('/clipboard/copy/:content')
    private async clipboard_copy(request: http.IncomingMessage, url: URL, response: http.ServerResponse, 
                           params: {content: string}) {
        if(params.content.length > (1 << 16)) {
            write_empty_response(response, 403);
            return;
        }

        this.clipcontent = params.content;
        write_empty_response(response, 200);
    }
    @simpleURL('/clipboard/copy')
    private async clipboard_copy_2(request: http.IncomingMessage, url: URL, response: http.ServerResponse) {
        try {
            const buf = await util.extractReadableStream(request, 1 << 16);
            this.clipcontent = buf;
            write_empty_response(response, 200);
        } catch {
            write_empty_response(response, 400);
        }
    }
    @simpleURL('/clipboard/paste')
    private async clipboard_paste(request: http.IncomingMessage, url: URL, response: http.ServerResponse) {
        if(this.clipcontent == null) {
            write_empty_response(response, 404);
        } else {
            response.statusCode = 200;
            response.end(this.clipcontent);
        }
    }
    @simpleURL('/clipboard/clear')
    private async clipboard_clear(request: http.IncomingMessage, url: URL, response: http.ServerResponse) {
        this.clipcontent = null;
        write_empty_response(response, 200);
    }

    private async responseNonPriviledgedFile(response: http.ServerResponse, 
                                             filename: string, indexfile: string, 
                                             head: boolean, range: [number,number]) //{
    {
        let ansfile = filename;
        try {
            const stat = await fs.promises.stat(filename);
            if (!stat.isFile && !stat.isSymbolicLink) {
                ansfile = indexfile;
            }
        } catch {
            ansfile = indexfile;
        }
        return await write_file_response(ansfile, response, range, {head: head});
    } //}

    /** default listener of request event */
    protected onupgrade(inc: http.IncomingMessage, socket: net.Socket, buf: Buffer) //{
    {
        upgradeHandler(inc, socket, buf);
    } //}
}

