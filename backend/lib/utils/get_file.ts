import { Response } from "express";
import { IncomingHttpHeaders } from 'http';
import { QueryDependency } from "../di";
import { FileSystem } from "../fileSystem/fileSystem";
import createError from "http-errors";
import assert from "assert";
import path from 'path';
import { FileType } from "../common/file_types";
import { constants } from "../constants";


export function parseRangeField(range: string): [number, number]
{
    if(range == null || range.length < 8 || !range.startsWith("bytes=")) return null;
    let nnn = range.substring(6);
    let fff = nnn.split("-");
    if (fff.length != 2) return null;
    let r1: number, r2: number;
    r1 = parseInt(fff[0]);
    if (r1 < 0) return null;
    if (fff[1] == "") {
        return [r1, -1];
    } else {
        r2 = parseInt(fff[1]);
        if(r1 <= r2) return [r1, r2];
    }
    return null;
}

export async function write_file_response(
    filename: string,
    headers: { [key: string]: string } | IncomingHttpHeaders,
    res: Response, 
    options?: {
        attachment?: boolean,
        attachmentFilename?: string,
        method_head?: boolean,
        allowRedirect?: boolean,
        range?: [number, number],
    })
{
    const filesystem = QueryDependency(FileSystem);
    assert(filename != null)
    options = options || {};
    const range = options.range || parseRangeField(headers['range']);

    let success: number = 200;
    if (range) success = 206;

    const filestat = await filesystem.stat(filename);
    if (filestat.filetype != FileType.reg)
        throw new createError.NotFound("file not found");
    if (range != null && filestat.size <= range[1]) 
        throw new createError.BadRequest("invalid range");

    if(options.attachment) {
        const bname = options.attachmentFilename || path.basename(filename);
        const attachment = `attachment; filename*=UTF-8''${encodeURI(bname)}`;
        res.setHeader('Content-Disposition', attachment);
    }

    const etag = Buffer.from(`${filename}; ${filestat.mtime.toUTCString()}; ${filestat.size};`).toString('base64');
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
        return  res.status(304).send(); // Not Modified
    } else if(headers['if-modified-since']) {
        const cachetime = new Date(headers['if-modified-since']);
        if(filestat.mtime.getTime() <= cachetime.getTime()) {
            return  res.status(304).send(); // Not Modified
        }
    }

    if (options.method_head) {
        return res.status(success).send();
    }

    if (options.allowRedirect && filesystem.canRedirect(filename)) {
        const urls = await filesystem.redirect(filename);
        if (urls.length > 0) {
            let locations = '';
            for (const url of urls) locations += (url + ',');
            res.setHeader("Location", locations);
            res.status(307).send();
            return;
        }
    }

    res.writeHead(success);
    await filesystem.writeFileToWritable(filename, res, startposition, content_length);
    res.end();
}
