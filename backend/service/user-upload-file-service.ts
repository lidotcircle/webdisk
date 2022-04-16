import { getDataSource } from "../index";
import { UploadedFile } from "../entity";
import { Repository } from "typeorm";
import createError from "http-errors";
import { Injectable, DIProperty } from "../lib/di";
import { UserService } from "./user-service";
import { FileSystem } from "../lib/fileSystem";
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { Request, Response } from "express";
import { syserr2httperr, write_file_response } from "../lib/utils";


@Injectable({
    lazy: true
})
export class UserUploadFileService {
    @DIProperty(UserService)
    private userService: UserService;

    @DIProperty(FileSystem)
    private filesystem: FileSystem;

    private ufRepo: Repository<UploadedFile>;

    constructor() {
        this.ufRepo = getDataSource().getRepository(UploadedFile);
    }

    private async resolveFilePath(fileid: string): Promise<string> {
        const one = await this.ufRepo.findOne({ where : {
            fileid: fileid
        }});
        if (!one) {
            throw new createError.NotFound(`file not found with fileid='${fileid}'`);
        }
        const user = await one.user;
        return path.join(user.rootpath, one.target);
    }

    async downloadFile(fileid: string, req: Request, res: Response, attachmentFilename?: string): Promise<void> {
        const filepath = await this.resolveFilePath(fileid);
        await write_file_response(filepath, req.headers, res, {
            attachment: true,
            method_head: req.method.toLowerCase() == 'head',
            attachmentFilename: attachmentFilename || path.basename(filepath),
        });
    }

    async saveToFile(username: string, filepath: string, stream: Readable): Promise<string>
    {
        if (filepath.startsWith("/")) {
            filepath = filepath.substring(1);
        }

        const user = await this.userService.getUser(username);
        if (!user) {
            throw createError(404, `User ${username} not found`);
        }

        const uf = new UploadedFile();
        const abs_filepath = path.join(user.rootpath, filepath);
        const fileid = uuidv4();
        uf.user = Promise.resolve(user);
        uf.userId = user.id;
        uf.target = filepath;
        uf.fileid = fileid;

        try {
            await this.filesystem.createNewFileWithReadableStream(abs_filepath, stream);
        } catch (e) {
            e = syserr2httperr(e);
            if (e instanceof createError.HttpError) {
                throw e;
            } else {
                throw new createError.InternalServerError(e?.message || "unknow error");
            }
        }
        await this.ufRepo.save(uf);
        return fileid;
    }
}
