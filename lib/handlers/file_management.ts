import { DB } from '../services';
import { MessageHandler } from '../message_handler';
import { MessageGateway } from '../message_gateway';
import { BasicMessage, MessageType } from '../common/message';
import { debug, info, warn, error } from '../logger';
import { FileMessage, FileMessageType, FileRequestMessage, FileResponseMessage, FileRequest } from '../common/file_message';
import { changeObject, checkArgv, subStringInObject } from '../utils';
import * as fs from 'fs';
import * as child_proc from 'child_process';
import path from 'path';
import * as annautils from 'annautils';
import * as md5 from 'md5';
import * as utils from '../utils';
import { FileStat, FileType } from '../common/file_types';
import { UserInfo } from '../common/db_types';
import { Stats } from 'fs';

function statToStat(fstat: Stats, file: string): FileStat {
    const ans = new FileStat();
    utils.assignTargetEnumProp(fstat, ans);
    ans["filename"] = file;
    if (fstat.isBlockDevice()) {
        ans["filetype"] = FileType.block;
    } else if (fstat.isDirectory()) {
        ans["filetype"] = FileType.dir;
    } else if (fstat.isFile()) {
        ans["filetype"] = FileType.reg;
    } else if (fstat.isCharacterDevice()) {
        ans["filetype"] = FileType.char;
    } else if (fstat.isSymbolicLink()) {
        ans["filetype"] = FileType.symbol;
    } else if (fstat.isFIFO()) {
        ans["filetype"] = FileType.fifo;
    } else if (fstat.isSocket()) {
        ans["filetype"] = FileType.socket;
    } else {
        ans["filetype"] = FileType.unknown;
    }
    return ans;
}

class FileManagement extends MessageHandler {
    private static GMSG = new FileMessage();
    private id: number = 0;

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
        await fs.promises.chmod(file, mode.toString(8));
    }

    private async copy(src: string, dst: string) {
        await fs.promises.copyFile(src, dst);
    }

    private async copyr(src: string, dst: string) {
        await annautils.fs.promises.copyr(src, dst);
    }

    private async execFile(file: string, argv: string[]) {
        return await new Promise((resolve, reject) => {
            child_proc.execFile(file, argv, (err, stdout, stderr) => {
                if(err) return reject(err);
                if(stderr && (!stdout || stdout.length == 0)) return reject(stderr);
                resolve(stdout);
            });
        });
    }

    private async getdir(dir: string): Promise<FileStat[]> {
        const files = await fs.promises.readdir(dir);
        const ans = [];
        for(let f of files) {
            const g = path.join(dir, f);
            try {
                ans.push(statToStat(await fs.promises.stat(g), g));
            } catch (err) {
                console.log(err);
            }
        }
        if(ans.length == 0) {
            throw new Error('getdir fail');
        }
        return ans;
    }
    
    private async fileMD5(file: string): Promise<string> {
        const fileBuf = await fs.promises.readFile(file);
        return md5(fileBuf);
    }

    private async mkdir(dir: string) {
        await fs.promises.mkdir(dir, {recursive: true});
    }

    private async move(src: string, dst: string) {
        await fs.promises.rename(src, dst);
    }

    private async read(file: string, position: number, length: number): Promise<Buffer> {
        const fd = await fs.promises.open(file, "r");
        let buf = Buffer.alloc(length);
        const b = (await fs.promises.read(fd, buf, 0, length, position)).buffer;
        await fd.close();
        return b;
    }

    private async remove(path: string) {
        const stat = await fs.promises.stat(path);
        if(stat.isDirectory()) {
            await fs.promises.rmdir(path);
        } else {
            await fs.promises.unlink(path);
        }
    }

    private async remover(path: string) {
        await annautils.fs.promises.removeRecusive(path);
    }

    private async stat(file: string): Promise<FileStat> {
        const fstat = await fs.promises.stat(file)
        return statToStat(fstat, file);
    }

    private async touch(path: string) {
        let cur = new Date();
        await fs.promises.utimes(path, cur, cur);
    }

    private async truncate(file: string, len: number) {
        await fs.promises.truncate(file, len);
    }

    private async write(file: string, position: number, buf: ArrayBuffer): Promise<number> {
        const fd = await fs.promises.open(file, "r+");
        const rs = await fs.promises.write(fd, new Uint8Array(buf), 0, buf.byteLength, position);
        await fd.close();
        return rs.bytesWritten;
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
                case FileRequest.GETDIR: {
                    checkArgv('s', argv);
                    resp.fm_msg.fm_response = changeObject(
                        await this.getdir(this.resolveUserPath(user, argv[0])),
                        (prop, val) => {
                            if(typeof val == 'string') {
                                if(val.startsWith(user.rootPath)) {
                                    return val.substr(user.rootPath.length);
                                } else {
                                    return val;
                                }
                            }
                        }
                    );
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
                    resp.fm_msg.fm_response = subStringInObject(
                        await this.stat(this.resolveUserPath(user, argv[0])),
                        /.*/, user.rootPath, '/');
                } break;
                case FileRequest.TOUCH: {
                    checkArgv('s', argv);
                    await this.fileMD5(this.resolveUserPath(user, argv[0]));
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
            resp.error = err.toString();
        }
    }
}
 
export const FileManager = new FileManagement();

