import { DB, filesystem } from '../services';
import { MessageHandler } from '../message_handler';
import { MessageGateway } from '../message_gateway';
import { BasicMessage, MessageType } from '../common/message';
import { debug, info, warn, error } from '../logger';
import { FileMessage, FileMessageType, FileRequestMessage, FileResponseMessage, FileRequest } from '../common/file_message';
import { changeObject, subStringInObject } from '../utils';
import path from 'path';
import * as annautils from 'annautils';
import * as utils from '../utils';
import * as util from 'util';
import { FileStat, FileType } from '../common/file_types';
import { UserInfo } from '../common/db_types';

function checkArgv(pat: string, argv: any[]) {
    if (!utils.checkArgv(pat, argv)) {
        throw new Error('bad argument');
    }
}

function replaceUserRootPath(obj: object, userRoot: string) {
    return changeObject(obj, (prop, val) => {
        if(typeof val == 'string' && val.startsWith(userRoot)) {
            let ans = val.substr(userRoot.length);
            if(!ans.startsWith('/')) {
                ans = '/' + ans;
            }
            return ans;
        } else {
            return val;
        }
    });
}

class FileManagement extends MessageHandler {
    private static GMSG = new FileMessage();
    private id: number = 0;

    constructor() {
        super();
    }

    async handleRequest(dispatcher: MessageGateway, msg: FileMessage) {
        for(let prop in FileManagement.GMSG) {
            if(msg[prop] === undefined) {
                warn('bad file message which doesn\'t contain "', prop, '", ignore it');
                return;
            }
        }

        let resp = new FileResponseMessage();
        resp.messageId = this.id++;
        resp.messageAck = msg.messageId;
        resp.error = null;
        msg.fm_msg = msg.fm_msg || {};

        switch(msg.fm_type) {
            case FileMessageType.Request: {
                const req = msg as FileRequestMessage;
                if(req.fm_msg.user_token == null || !(await DB.getUserInfo(req.fm_msg.user_token))) {
                    resp.error = 'bad user token';
                } else {
                    await this.access(req, resp);
                }
            } break;
            case FileMessageType.Response:
            case FileMessageType.Event: {
                resp.error = 'bad file management type';
            } break;
            default: {
                warn('unkonw file message type, ignore it');
                return;
            }
        }

        if(resp.error) {
            warn('requeset error: ', resp.error);
        }
        dispatcher.response(resp);
    }

    private resolveUserPath(user: UserInfo, dir: string): string {
        if(!path.isAbsolute(dir)) {
            throw new Error("require absolute path");
        }
        const ans = path.join(user.rootPath, dir.substring(1));
        return ans;
    }

    private async chmod(file: string, mode: number) {
        await filesystem.chmod(file, mode);
    }

    private async copy(src: string, dst: string) {
        await filesystem.copy(src, dst);
    }

    private async copyr(src: string, dst: string) {
        await filesystem.copyr(src, dst);
    }

    private async execFile(file: string, argv: string[]): Promise<string> {
        return await filesystem.execFile(file, argv);
    }

    private async getdir(dir: string): Promise<FileStat[]> {
        return await filesystem.getdir(dir);
    }
    
    private async fileMD5(file: string): Promise<string> {
        return await filesystem.fileMD5(file);
    }

    private async fileSliceMD5(file: string, position: number, len: number): Promise<string> {
        return await filesystem.fileSliceMD5(file, position, len);
    }

    private async mkdir(dir: string) {
        await filesystem.mkdir(dir);
    }

    private async move(src: string, dst: string) {
        await filesystem.move(src, dst);
    }

    private async read(file: string, position: number, length: number): Promise<Buffer> {
        return await filesystem.read(file, position, length);
    }

    private async remove(path: string) {
        await filesystem.remove(path);
    }

    private async remover(path: string) {
        await filesystem.remover(path);
    }

    private async stat(file: string): Promise<FileStat> {
        return await filesystem.stat(file);
    }

    private async touch(path: string) {
        await filesystem.touch(path);
    }

    private async truncate(file: string, len: number) {
        await filesystem.truncate(file, len);
    }

    private async write(file: string, position: number, buf: ArrayBuffer): Promise<number> {
        return await filesystem.write(file, position, buf);
    }

    async access(req_msg: FileRequestMessage, resp: FileResponseMessage) {
        const req = req_msg.fm_msg;
        const argv = req.fm_request_argv;
        const user = await DB.getUserInfo(req.user_token);
        if(!user) {
            resp.error = 'invalid token access file service';
            return;
        }
        debug(`${user.username} make ${req.fm_request} request`);
        try {
            switch(req.fm_request) {
                case FileRequest.CHMOD: {
                    checkArgv('sn', argv);
                    await this.chmod(this.resolveUserPath(user, argv[0]), argv[1]);
                } break;
                case FileRequest.COPY: {
                    checkArgv('ss', argv);
                    await this.copy(this.resolveUserPath(user, argv[0]),
                                    this.resolveUserPath(user, argv[1]));
                } break;
                case FileRequest.COPYR: {
                    checkArgv('ss', argv);
                    await this.copyr(this.resolveUserPath(user, argv[0]),
                                     this.resolveUserPath(user, argv[1]));
                } break;
                case FileRequest.EXECUTE: {
                    checkArgv('sa', argv);
                    resp.fm_msg.fm_response = await this.execFile(this.resolveUserPath(user, argv[0]), argv[1]);
                } break;
                case FileRequest.FILEMD5: {
                    checkArgv('s', argv);
                    resp.fm_msg.fm_response = await this.fileMD5(this.resolveUserPath(user, argv[0]));
                } break;
                case FileRequest.FILEMD5_SLICE: {
                    checkArgv('snn', argv);
                    resp.fm_msg.fm_response = await this.fileSliceMD5(this.resolveUserPath(user, argv[0]), argv[1], argv[2]);
                } break;
                case FileRequest.GETDIR: {
                    checkArgv('s', argv);
                    resp.fm_msg.fm_response = replaceUserRootPath(
                        await this.getdir(this.resolveUserPath(user, argv[0])),
                        user.rootPath);
                } break;
                case FileRequest.MKDIR: {
                    checkArgv('s', argv);
                    await this.mkdir(this.resolveUserPath(user, argv[0]));
                } break;
                case FileRequest.MOVE: {
                    checkArgv('ss', argv);
                    await this.move(this.resolveUserPath(user, argv[0]),
                                    this.resolveUserPath(user, argv[1]));
                } break;
                case FileRequest.READ: {
                    checkArgv('snn', argv);
                    resp.fm_msg.fm_response = await this.read(this.resolveUserPath(user, argv[0]), argv[1], argv[2]);
                } break;
                case FileRequest.REMOVE: {
                    checkArgv('s', argv);
                    await this.remove(this.resolveUserPath(user, argv[0]));
                } break;
                case FileRequest.REMOVER: {
                    checkArgv('s', argv);
                    await this.remover(this.resolveUserPath(user, argv[0]));
                } break;
                case FileRequest.STAT: {
                    checkArgv('s', argv);
                    resp.fm_msg.fm_response = replaceUserRootPath(
                        await this.stat(this.resolveUserPath(user, argv[0])), 
                        user.rootPath);
                } break;
                case FileRequest.TOUCH: {
                    checkArgv('s', argv);
                    await this.touch(this.resolveUserPath(user, argv[0]));
                } break;
                case FileRequest.TRUNCATE: {
                    checkArgv('sn', argv);
                    await this.truncate(this.resolveUserPath(user, argv[0]), argv[1]);
                } break;
                case FileRequest.WRITE: {
                    checkArgv('snf', argv);
                    resp.fm_msg.fm_response = await this.write(this.resolveUserPath(user, argv[0]), argv[1], argv[2]);
                } break;
                default:
                    resp.error = 'file message bad request';
                    break;
            }
        } catch (err) {
            console.error(err);
            resp.error = err.toString();
        }
    }
}
 
export const FileManager = new FileManagement();

