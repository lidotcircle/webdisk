import { Injectable } from '@angular/core';
import { FileStat, FileRequestMessage, FileRequest, FileResponseMessage, MessageSource} from '../common';
import { WSChannelService } from './wschannel.service';
import { assignTargetEnumProp, hasArrayBuffer } from '../utils';
import { AuthService } from 'src/app/service/auth';

export enum FileSystemEvent {
    CHDIR  = 'CHDIR',
    UPDATE = 'UPDATE'
}

const LongLongTimeout = 60 * 1000;

@Injectable({
    providedIn: 'root'
})
export class FileSystemManagerService {
    constructor(private wschannel: WSChannelService,
                private userService: AuthService) {
        window['man'] = this;
    }

    private async authWithToken(req: FileRequestMessage){
        req.accessToken = await this.userService.jwtTokenAsync();
    }

    private absolutePath(dst: string) {
        if(!dst.startsWith('/')) {
            throw new Error('not an absolute path');
        }
    }

    private async sendTo(req: {type: FileRequest, timeout?: number}, ...argv: any[]): Promise<any> {
        const reqmsg = new FileRequestMessage();
        reqmsg.messageSource = MessageSource.Request;
        await this.authWithToken(reqmsg);
        reqmsg.fm_msg.fm_request = req.type;
        reqmsg.fm_msg.fm_request_argv = argv;
        let binary: boolean = hasArrayBuffer(argv);
        const resp = await this.wschannel.send(reqmsg, !binary, req.timeout);

        if(resp.error) {
            throw resp.error;
        }

        return (resp as FileResponseMessage)?.fm_msg?.fm_response;
    }

    async getdir(dir: string): Promise<FileStat[]> {
        this.absolutePath(dir);
        const ans = [];
        for(let stat of await this.sendTo({type: FileRequest.GETDIR}, dir)) {
            let newStat = new FileStat();
            assignTargetEnumProp(stat, newStat);
            ans.push(newStat);
        };
        return ans;
    }

    async append(file: string, buffer: ArrayBuffer): Promise<void> {
        this.absolutePath(file);
        await this.sendTo({
            type: FileRequest.APPEND, 
            timeout: Math.max(5000, buffer.byteLength / (0.1 * 1024))
        }, file, buffer);
    }

    async createUploadSession(file: string, startpos: number): Promise<string> {
        this.absolutePath(file);
        return await this.sendTo({type: FileRequest.CREATE_UPLOAD_SESSION }, file, startpos);
    }

    async uploadSlice(uploadSessionId: string, pos: number, buf: ArrayBuffer): Promise<void> {
        await this.sendTo({
            type: FileRequest.UPLOAD_SLICE, 
            timeout: Math.max(60 * 1000, buf.byteLength / (0.1 * 1024))
        }, uploadSessionId, pos, buf);
    }

    async expireUploadSession(uploadSessionId: string): Promise<void> {
        await this.sendTo({type: FileRequest.EXPIRE_UPLOAD_SESSION }, uploadSessionId);
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

        await this.sendTo({type: FileRequest.CHMOD}, file, _mode);
    }

    async copy(src_file: string, dst_file: string): Promise<void> {
        this.absolutePath(src_file);
        this.absolutePath(dst_file);

        await this.sendTo({type: FileRequest.COPY, timeout: LongLongTimeout}, src_file, dst_file);
    }

    async copyr(src_file: string, dst_file: string): Promise<void> {
        this.absolutePath(src_file);
        this.absolutePath(dst_file);

        await this.sendTo({type: FileRequest.COPYR, timeout: LongLongTimeout}, src_file, dst_file);
    }

    async execute(file: string): Promise<string> {
        this.absolutePath(file);
        return await this.sendTo({type: FileRequest.EXECUTE, timeout: LongLongTimeout}, file);
    }

    async md5(file: string): Promise<string> {
        this.absolutePath(file);
        return await this.sendTo({type: FileRequest.FILEMD5, timeout: LongLongTimeout}, file);
    }

    async sliceMd5(file: string, position: number, length: number): Promise<string> {
        this.absolutePath(file);
        return await this.sendTo({
            type: FileRequest.FILEMD5_SLICE, 
            timeout: LongLongTimeout
        }, file, position, length);
    }

    async mkdir(dir: string): Promise<void> {
        this.absolutePath(dir);
        return await this.sendTo({type: FileRequest.MKDIR}, dir);
    }

    async move(src_file: string, dst_file: string): Promise<void> {
        this.absolutePath(src_file);
        this.absolutePath(dst_file);

        await this.sendTo({type: FileRequest.MOVE, timeout: LongLongTimeout}, src_file, dst_file);
    }

    async remove(file: string): Promise<void> {
        this.absolutePath(file);
        return await this.sendTo({type: FileRequest.REMOVE}, file);
    }

    async remover(file: string): Promise<void> {
        this.absolutePath(file);
        return await this.sendTo({type: FileRequest.REMOVER}, file);
    }

    async stat(file: string): Promise<FileStat> {
        this.absolutePath(file);
        let ans = new FileStat();
        assignTargetEnumProp(await this.sendTo({type: FileRequest.STAT}, file), ans);
        return ans;
    }

    async touch(file: string): Promise<void> {
        this.absolutePath(file);
        return await this.sendTo({type: FileRequest.TOUCH}, file);
    }

    async truncate(file: string, length: number): Promise<void> {
        this.absolutePath(file);
        return await this.sendTo({type: FileRequest.TRUNCATE}, file, length);
    }

    async read(file: string, position: number = 0, length: number = -1): Promise<ArrayBuffer> {
        this.absolutePath(file);
        return await this.sendTo({
            type: FileRequest.READ, 
            timeout: Math.max(5000, length / (1 * 1024))
        }, file, position, length);
    }

    async write(file: string, position: number = 0, buf: ArrayBuffer): Promise<number> {
        this.absolutePath(file);
        return await this.sendTo({
            type: FileRequest.WRITE, 
            timeout: Math.max(5000, buf.byteLength / (1 * 1024))
        }, file, position, buf);
    }

    async createFileWithBuffer(file: string, buf: ArrayBuffer): Promise<void> {
        this.absolutePath(file);
        return await this.sendTo({
            type: FileRequest.CREATE_FILE_WITH_BUFFER, 
            timeout: Math.max(5000, buf.byteLength / (0.1 * 1024))
        }, file, buf);
    }
}

