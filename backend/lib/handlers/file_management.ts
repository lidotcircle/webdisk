import path from 'path';
import { MessageHandler } from '../message_handler';
import { MessageGateway } from '../message_gateway';
import { MessageSource } from '../common/message/message';
import { debug, warn, JWTService } from '../../service';
import { FileMessage, FileRequestMessage, FileResponseMessage, FileRequest } from '../common/message/file_message';
import { changeObject } from '../utils';
import * as utils from '../utils';
import { FileStat } from '../common/file_types';
import { FileSystem } from '../fileSystem';
import { DIGetter } from '../di';

function checkArgv(pat: string, argv: any[]) {
    if (!utils.checkArgv(pat, argv)) {
        throw new Error('bad argument');
    }
}

function replaceUserRootPath(obj: object, userRoot: string) {
    return changeObject(obj, (_prop, val) => {
        if(typeof val == 'string' && val.startsWith(userRoot)) {
            let ans = val.substring(userRoot.length);
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

    @DIGetter(FileSystem)
    private get filesystem(): FileSystem { return null; }

    @DIGetter(JWTService)
    private get jwt(): JWTService { return null; }

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

        switch(msg.messageSource) {
            case MessageSource.Request: {
                const req = msg as FileRequestMessage;
                if(req.accessToken == null || !this.jwt.verify(req.accessToken)) {
                    resp.error = 'bad user token';
                } else {
                    await this.access(req, resp);
                }
            } break;
            case MessageSource.Response:
            case MessageSource.Event: {
                resp.error = 'bad file management type';
            } break;
            default: {
                warn('unkonw file message type, ignore it');
                return;
            }
        }

        if(resp.error) {
            warn(`requeset error: ${resp.error}`);
        }
        dispatcher.response(resp);
    }

    private resolveUserPath(rootpath: string, dir: string): string {
        if(!path.isAbsolute(dir)) {
            throw new Error("require absolute path");
        }
        const ans = path.join(rootpath, dir.substring(1));
        return ans;
    }

    private async append(file: string, buffer: ArrayBuffer) {
        await this.filesystem.append(file, buffer);
    }

    private async chmod(file: string, mode: number) {
        await this.filesystem.chmod(file, mode);
    }

    private async copy(src: string, dst: string) {
        await this.filesystem.copy(src, dst);
    }

    private async copyr(src: string, dst: string) {
        await this.filesystem.copyr(src, dst);
    }

    private async execFile(file: string, argv: string[]): Promise<string> {
        return await this.filesystem.execFile(file, argv);
    }

    private async getdir(dir: string): Promise<FileStat[]> {
        return await this.filesystem.getdir(dir);
    }
    
    private async fileMD5(file: string): Promise<string> {
        return await this.filesystem.fileMD5(file);
    }

    private async fileSliceMD5(file: string, position: number, len: number): Promise<string> {
        return await this.filesystem.fileSliceMD5(file, position, len);
    }

    private async mkdir(dir: string) {
        await this.filesystem.mkdir(dir);
    }

    private async move(src: string, dst: string) {
        await this.filesystem.move(src, dst);
    }

    private async read(file: string, position: number, length: number): Promise<Buffer> {
        return await this.filesystem.read(file, position, length);
    }

    private async remove(path: string) {
        await this.filesystem.remove(path);
    }

    private async remover(path: string) {
        await this.filesystem.remover(path);
    }

    private async stat(file: string): Promise<FileStat> {
        return await this.filesystem.stat(file);
    }

    private async touch(path: string) {
        await this.filesystem.touch(path);
    }

    private async truncate(file: string, len: number) {
        await this.filesystem.truncate(file, len);
    }

    private async write(file: string, position: number, buf: ArrayBuffer): Promise<number> {
        return await this.filesystem.write(file, position, buf);
    }

    async access(req_msg: FileRequestMessage, resp: FileResponseMessage) {
        const req = req_msg.fm_msg;
        const argv = req.fm_request_argv;
        const user = this.jwt.decode(req_msg.accessToken);
        if(!user || !user.rootpath) {
            resp.error = 'invalid token access file service';
            return;
        }
        const rootpath = user.rootpath;
        debug(`${user.username} make '${req.fm_request}' request`);
        try {
            switch(req.fm_request) {
                case FileRequest.APPEND: {
                    checkArgv('sf', argv);
                    await this.append(this.resolveUserPath(rootpath, argv[0]), argv[1]);
                } break;
                case FileRequest.CHMOD: {
                    checkArgv('sn', argv);
                    await this.chmod(this.resolveUserPath(rootpath, argv[0]), argv[1]);
                } break;
                case FileRequest.COPY: {
                    checkArgv('ss', argv);
                    await this.copy(this.resolveUserPath(rootpath, argv[0]),
                                    this.resolveUserPath(rootpath, argv[1]));
                } break;
                case FileRequest.COPYR: {
                    checkArgv('ss', argv);
                    await this.copyr(this.resolveUserPath(rootpath, argv[0]),
                                     this.resolveUserPath(rootpath, argv[1]));
                } break;
                case FileRequest.EXECUTE: {
                    checkArgv('sa', argv);
                    resp.fm_msg.fm_response = await this.execFile(this.resolveUserPath(rootpath, argv[0]), argv[1]);
                } break;
                case FileRequest.FILEMD5: {
                    checkArgv('s', argv);
                    resp.fm_msg.fm_response = await this.fileMD5(this.resolveUserPath(rootpath, argv[0]));
                } break;
                case FileRequest.FILEMD5_SLICE: {
                    checkArgv('snn', argv);
                    resp.fm_msg.fm_response = await this.fileSliceMD5(this.resolveUserPath(rootpath, argv[0]), argv[1], argv[2]);
                } break;
                case FileRequest.GETDIR: {
                    checkArgv('s', argv);
                    resp.fm_msg.fm_response = replaceUserRootPath(
                        await this.getdir(this.resolveUserPath(rootpath, argv[0])),
                        rootpath);
                } break;
                case FileRequest.MKDIR: {
                    checkArgv('s', argv);
                    await this.mkdir(this.resolveUserPath(rootpath, argv[0]));
                } break;
                case FileRequest.MOVE: {
                    checkArgv('ss', argv);
                    await this.move(this.resolveUserPath(rootpath, argv[0]),
                                    this.resolveUserPath(rootpath, argv[1]));
                } break;
                case FileRequest.READ: {
                    checkArgv('snn', argv);
                    resp.fm_msg.fm_response = await this.read(this.resolveUserPath(rootpath, argv[0]), argv[1], argv[2]);
                } break;
                case FileRequest.REMOVE: {
                    checkArgv('s', argv);
                    await this.remove(this.resolveUserPath(rootpath, argv[0]));
                } break;
                case FileRequest.REMOVER: {
                    checkArgv('s', argv);
                    await this.remover(this.resolveUserPath(rootpath, argv[0]));
                } break;
                case FileRequest.STAT: {
                    checkArgv('s', argv);
                    resp.fm_msg.fm_response = replaceUserRootPath(
                        await this.stat(this.resolveUserPath(rootpath, argv[0])), 
                        rootpath);
                } break;
                case FileRequest.TOUCH: {
                    checkArgv('s', argv);
                    await this.touch(this.resolveUserPath(rootpath, argv[0]));
                } break;
                case FileRequest.TRUNCATE: {
                    checkArgv('sn', argv);
                    await this.truncate(this.resolveUserPath(rootpath, argv[0]), argv[1]);
                } break;
                case FileRequest.WRITE: {
                    checkArgv('snf', argv);
                    resp.fm_msg.fm_response = await this.write(this.resolveUserPath(rootpath, argv[0]), argv[1], argv[2]);
                } break;
                case FileRequest.CREATE_UPLOAD_SESSION: {
                    checkArgv('sn', argv);
                    resp.fm_msg.fm_response = await this.filesystem.createUploadSession(argv[0], argv[1]);
                } break;
                case FileRequest.UPLOAD_SLICE: {
                    checkArgv('snf', argv);
                    await this.filesystem.uploadSlice(argv[0], argv[1], argv[2]);
                } break;
                case FileRequest.EXPIRE_UPLOAD_SESSION: {
                    checkArgv('s', argv);
                    await this.filesystem.expireUploadSession(argv[0]);
                } break;
                default:
                    resp.error = 'file message bad request';
                    break;
            }
        } catch (err) {
            console.error(err);
            resp.error = err.message || 'Unexpected Error';
        }
    }
}
 
const FileManager = new FileManagement();
export default FileManager;

