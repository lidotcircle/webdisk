/* WEB DISK */

import * as net   from 'net';
import * as path  from 'path';
import * as http  from 'http';
import * as util  from './utils';
import * as stream from 'stream';
import * as crypto from 'crypto';

import { URL }       from 'url';
import { BadRequest, HttpUnexpected, NotAcceptable, NotFound, PayloadTooLarge, TemporaryRedirect, Unauthorized, URITooLarge } from './errors';

import { constants } from './constants';
import { upgradeHandler } from './message_gateway';

import { debug, info, warn, error } from './logger';

import { cons } from './utils';
import { UserInfo } from './common/db_types';
import { SimpleHttpServer, simpleURL } from './simple_http_server';
import { Writable } from 'stream';
import { FileType } from './common/file_types';
import { AsyncQueryDependency, DIProperty } from './di';
import { Database, WDDatabase } from './database/database';
import { FileSystem } from './fileSystem';

function Etag(str: string) {
    const md5 = crypto.createHash('md5');
    md5.update(str);
    return `"${md5.digest('hex')}"`;
}
const LonglongFuture = (new Date()).setFullYear(8000);

/** 
 * response a file or partial file that is in server to client, 
 * if whole file status code is [200 OK], if partial file status code is [206 partial content]
 * @param { string } filename file path
 * @param { ServerResponse } res response stream
 * @param { [number, number] } range range of file, null represent whole file
 */
async function write_file_response(filename: string,         //{
                                   headers: http.IncomingHttpHeaders,
                                   res: http.ServerResponse, 
                                   range: [number, number], 
                                   options: {
                                       attachment?: boolean,
                                       head?: boolean,
                                       allowRedirect?: boolean
                                   })
{
    const DB = await AsyncQueryDependency(WDDatabase);
    const filesystem = await AsyncQueryDependency(FileSystem);

    if (filename == null) {
        throw new BadRequest();
    }
    let success: number = 200;
    if (range) success = 206;

    let filestat = await filesystem.stat(filename);
    if (filestat.filetype != FileType.reg)
        throw new NotFound();
    if (range != null && filestat.size <= range[1]) 
        throw new NotAcceptable();

    if(options.attachment) {
        const bname = path.basename(filename);
        let attachment = `attachment; filename*=UTF-8''${encodeURI(bname)}`;
        res.setHeader('Content-Disposition', attachment);
    }

    const etag = Etag(`${filename}; ${filestat.mtime.toUTCString()}; ${filestat.size};`);
    res.setHeader('Etag', etag);

    let content_length: number;
    let startposition: number;
    if (range == null || (headers['if-range'] && headers['if-range'] != etag)) {
        success = 200;
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
        if (range[1] != -1) {
            res.setHeader("Content-Range", `bytes ${range[0]}-${range[1]}/${filestat.size}`);
        } else {
            res.setHeader("Content-Range", `bytes ${range[0]}-${filestat.size - 1}/${filestat.size}`);
        }
    }

    if(headers['if-none-match'] == etag) {
        res.statusCode = 304; // Not Modified
        res.end();
        return;
    } else if(headers['if-modified-since']) {
        const cachetime = new Date(headers['if-modified-since']);
        if(filestat.mtime.getTime() <= cachetime.getTime()) {
            res.statusCode = 304; // Not Modified
            res.end();
            return;
        }
    }

    res.statusCode = success;
    if (options.head) {
        res.end();
        return;
    }

    if(options.allowRedirect && await filesystem.canRedirect(filename)) {
        const redirectUrls = await filesystem.redirect(filename);
        throw new TemporaryRedirect(redirectUrls);
    } else {
        res.writeHead(success);
        await filesystem.writeFileToWritable(filename, res, startposition, content_length);
    }
    res.end();
} //}

function write_empty_response(res: http.ServerResponse, sc: number = 405) //{
{
    res.statusCode = sc;
    res.end();
} //}

export class HttpServer extends SimpleHttpServer
{
    @DIProperty(WDDatabase)
    private DB: Database;
    @DIProperty(FileSystem)
    private filesystem: FileSystem;
    private webroot: string;

    private clipcontent: string | Buffer = null;
    constructor (webroot: string) //{
    {
        super();

        this.webroot = webroot;
        this.on("upgrade", this.onupgrade);
    } //}

    @simpleURL(cons.DiskPrefix + '/.+')
    private async diskFile(request: http.IncomingMessage, url: URL, response: http.ServerResponse) //{
    {
        const head: boolean = request.method.toLowerCase() == "head";

        const token = url.searchParams.get(cons.DownloadTokenName);
        const stoken = url.searchParams.get(cons.DownloadShortTermTokenName);
        if (token == null && stoken == null) {
            throw new Unauthorized();
        }
        const download = async (uinfo: UserInfo) => {
            if (uinfo == null) {
                throw new Unauthorized();
            }
            const filename = path.resolve(uinfo.rootPath, decodeURI(url.pathname.substring(cons.DiskPrefix.length + 1)));
            const range: [number, number] = util.parseRangeField(request.headers.range);
            const allowRedirect = await this.DB.allowRedirectByUsername(uinfo.username);
            await write_file_response(filename, request.headers, response, range, {head: head, allowRedirect: allowRedirect});
        };
        if (!!token) {
            await download(await this.DB.getUserInfo(token));
        } else {
            await download(await this.DB.UserInfoByShortTermToken(stoken));
        }
    } //}

    @simpleURL(cons.NamedLinkPREFIX + '/:link')
    private async namedLinkFile(request: http.IncomingMessage, url: URL, response: http.ServerResponse, params: {link: string}) //{
    {
        const head: boolean = request.method.toLowerCase() == "head";
        const range: [number, number] = util.parseRangeField(request.headers.range);

        const namedlink = params.link;
        if(namedlink == null) {
            throw new NotFound();
        }

        const user = await this.DB.queryValidNameEntry(namedlink);
        const filename = path.resolve(user.userinfo.rootPath, user.destination.substr(1));
        await write_file_response(filename, request.headers, response, range, {
            head: head, 
            attachment: true, 
            allowRedirect: user.allowRedirect
        });
    } //}

    @simpleURL('/.*')
    private async defaultURL(request: http.IncomingMessage, url: URL, response: http.ServerResponse) //{
    {
        if(url.pathname == '/') url.pathname = '/index.html';
        console.log("root: ", this.webroot);
        const filename  = path.resolve(this.webroot, url.pathname.substring(1));
        const indexfile = path.resolve(this.webroot, 'index.html');
        const head: boolean = request.method.toLowerCase() == "head";
        const range: [number, number] = util.parseRangeField(request.headers.range);

        await this.responseNonPriviledgedFile(request.headers, response, filename, indexfile, head, range);
    } //}

    @simpleURL('/clipboard/copy/:content')
    private async clipboard_copy(request: http.IncomingMessage, url: URL, response: http.ServerResponse, 
                           params: {content: string}) {
        if(params.content.length > (1 << 16)) {
            throw new URITooLarge();
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
            throw new PayloadTooLarge();
        }
    }
    @simpleURL('/clipboard/paste')
    private async clipboard_paste(request: http.IncomingMessage, url: URL, response: http.ServerResponse) {
        if(this.clipcontent == null) {
            throw new NotFound();
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

    private async responseNonPriviledgedFile(httpheaders: http.IncomingHttpHeaders,
                                             response: http.ServerResponse, 
                                             filename: string, indexfile: string, 
                                             head: boolean, range: [number,number]) //{
    {
        let ansfile = filename;
        try {
            const stat = await this.filesystem.stat(filename);
            if (stat.filetype != FileType.reg && stat.filetype != FileType.symbol) {
                ansfile = indexfile;
            }
        } catch {
            ansfile = indexfile;
        }
        return await write_file_response(ansfile, httpheaders, response, range, {head: head});
    } //}

    /** default listener of request event */
    protected onupgrade(request: http.IncomingMessage, socket: net.Socket, buf: Buffer) //{
    {
        upgradeHandler(request, socket, buf);
    } //}
}

