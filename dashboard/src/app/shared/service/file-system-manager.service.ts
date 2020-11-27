import { Injectable } from '@angular/core';
import { FileStat, FileRequestMessage, FileRequest, FileResponseMessage } from '../common';
import { WSChannelService } from './wschannel.service';
import { AccountManagerService } from './account-manager.service';

export enum FileSystemEvent {
    CHDIR  = 'CHDIR',
    UPDATE = 'UPDATE'
}

@Injectable({
    providedIn: 'root'
})
export class FileSystemManagerService {
    constructor(private wschannel: WSChannelService,
                private accountManager: AccountManagerService) {}

    private authWithToken(req: FileRequestMessage){
        if(this.accountManager.LoginToken == null) {
            throw new Error('authorization fail');
        }
        req.fm_msg.user_token = this.accountManager.LoginToken;
    }

    private absolutePath(dst: string) {
        if(!dst.startsWith('/')) {
            throw new Error('not an absolute path');
        }
    }

    private async sendTo(req_type: FileRequest, ...argv): Promise<any> {
        const req = new FileRequestMessage();
        this.authWithToken(req);
        req.fm_msg.fm_request = req_type;
        req.fm_msg.fm_request_argv = argv;
        const resp = await this.wschannel.send(req);

        return (resp as FileResponseMessage).fm_msg.fm_response;
    }

    async getdir(dir: string): Promise<FileStat[]> {
        this.absolutePath(dir);
        return await this.sendTo(FileRequest.GETDIR, dir);
    }

    async chmod(file: string, mode: string | number): Promise<void> {
        this.absolutePath(file);
        let _mode = mode;
        if(typeof mode == 'string') {
            if(!mode.match(/[0-7]{4}/)) {
                throw new Error(`argument error: bad file mode '${mode}'`);
            } else {
                _mode = parseInt(mode, 8);
            }
        }

        await this.sendTo(FileRequest.CHMOD, file, _mode);
    }

    async copy(src_file: string, dst_file: string): Promise<void> {
        this.absolutePath(src_file);
        this.absolutePath(dst_file);

        await this.sendTo(FileRequest.COPY, src_file, dst_file);
    }

    async copyr(src_file: string, dst_file: string): Promise<void> {
        this.absolutePath(src_file);
        this.absolutePath(dst_file);

        await this.sendTo(FileRequest.COPYR, src_file, dst_file);
    }

    async execute(file: string): Promise<string> {
        this.absolutePath(file);
        return await this.sendTo(FileRequest.EXECUTE, file);
    }

    async mkdir(dir: string): Promise<void> {
        this.absolutePath(dir);
        return await this.sendTo(FileRequest.MKDIR, dir);
    }

    async move(src_file: string, dst_file: string): Promise<void> {
        this.absolutePath(src_file);
        this.absolutePath(dst_file);

        await this.sendTo(FileRequest.MOVE, src_file, dst_file);
    }

    async remove(file: string): Promise<void> {
        this.absolutePath(file);
        return await this.sendTo(FileRequest.REMOVE, file);
    }

    async remover(file: string): Promise<void> {
        this.absolutePath(file);
        return await this.sendTo(FileRequest.REMOVER, file);
    }

    async stat(file: string): Promise<FileStat> {
        this.absolutePath(file);
        return await this.sendTo(FileRequest.STAT, file);
    }

    async touch(file: string): Promise<FileStat> {
        this.absolutePath(file);
        return await this.sendTo(FileRequest.TOUCH, file);
    }

    async truncate(file: string, length: number): Promise<void> {
        this.absolutePath(file);
        return await this.sendTo(FileRequest.TRUNCATE, length);
    }

    async read(file: string, offset: number = 0, length: number = -1): Promise<ArrayBuffer> {
        this.absolutePath(file);
        return await this.sendTo(FileRequest.READ, file, offset, length);
    }

    async write(file: string, offset: number = 0, buf: ArrayBuffer): Promise<number> {
        this.absolutePath(file);
        return await this.sendTo(FileRequest.WRITE, file, offset, buf);
    }
}

