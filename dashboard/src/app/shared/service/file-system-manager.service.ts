import { Injectable } from '@angular/core';
import { FileStat, FileRequestMessage, FileRequest, FileResponseMessage, FileMessageType } from '../common';
import { WSChannelService } from './wschannel.service';
import { AccountManagerService } from './account-manager.service';
import { assignTargetEnumProp, isArrayBuffer, hasArrayBuffer } from '../utils';

export enum FileSystemEvent {
    CHDIR  = 'CHDIR',
    UPDATE = 'UPDATE'
}

@Injectable({
    providedIn: 'root'
})
export class FileSystemManagerService {
    constructor(private wschannel: WSChannelService,
                private accountManager: AccountManagerService) {
        window['man'] = this;
    }

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
        req.fm_type = FileMessageType.Request;
        this.authWithToken(req);
        req.fm_msg.fm_request = req_type;
        req.fm_msg.fm_request_argv = argv;
        let binary: boolean = hasArrayBuffer(argv);
        const resp = await this.wschannel.send(req, !binary);

        if(resp.error) {
            throw resp.error;
        }

        return (resp as FileResponseMessage)?.fm_msg?.fm_response;
    }

    async getdir(dir: string): Promise<FileStat[]> {
        this.absolutePath(dir);
        const ans = [];
        for(let stat of await this.sendTo(FileRequest.GETDIR, dir)) {
            let newStat = new FileStat();
            assignTargetEnumProp(stat, newStat);
            ans.push(newStat);
        };
        return ans;
    }

    async append(file: string, buffer: ArrayBuffer): Promise<void> {
        this.absolutePath(file);
        await this.sendTo(FileRequest.APPEND, file, buffer);
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

    async md5(file: string): Promise<string> {
        this.absolutePath(file);
        return await this.sendTo(FileRequest.FILEMD5, file);
    }

    async sliceMd5(file: string, position: number, length: number): Promise<string> {
        this.absolutePath(file);
        return await this.sendTo(FileRequest.FILEMD5_SLICE, file, position, length);
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
        let ans = new FileStat();
        assignTargetEnumProp(await this.sendTo(FileRequest.STAT, file), ans);
        return ans;
    }

    async touch(file: string): Promise<void> {
        this.absolutePath(file);
        return await this.sendTo(FileRequest.TOUCH, file);
    }

    async truncate(file: string, length: number): Promise<void> {
        this.absolutePath(file);
        return await this.sendTo(FileRequest.TRUNCATE, file, length);
    }

    async read(file: string, position: number = 0, length: number = -1): Promise<ArrayBuffer> {
        this.absolutePath(file);
        return await this.sendTo(FileRequest.READ, file, position, length);
    }

    async write(file: string, position: number = 0, buf: ArrayBuffer): Promise<number> {
        this.absolutePath(file);
        return await this.sendTo(FileRequest.WRITE, file, position, buf);
    }
}

