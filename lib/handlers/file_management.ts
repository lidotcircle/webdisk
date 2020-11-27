import { DB } from '../services';
import { MessageHandler } from '../message_handler';
import { MessageGateway } from '../message_gateway';
import { BasicMessage, MessageType } from '../common/message';
import { debug, info, warn, error } from '../logger';
import { FileMessage, FileMessageType, FileRequestMessage, FileResponseMessage, FileRequest } from 'lib/common/file_message';
import { checkArgv } from 'lib/utils';
import path from 'path';
import * as annautils from 'annautils';
import { FileStat } from 'lib/common/file_types';


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

        let resp = new FileMessage();
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
                warn(resp.error);
            } break;
            default: {
                warn('unkonw file message type, ignore it');
                return;
            }
        }
        
        dispatcher.response(resp);
    }

    async access(req_msg: FileRequestMessage, resp: FileResponseMessage) {
        const req = req_msg.fm_msg;
        const user = await DB.getUserInfo(req.user_token);
        switch(req.fm_request) {
            case FileRequest.GETDIR: {
                if(!checkArgv('s', req.fm_request_argv) || !req.fm_request[0].startsWith('/')) {
                    resp.error = 'bad argument';
                    return;
                };

                const dir = path.join(user.rootPath, req.fm_request_argv[0]);
                try {
                    const stats = annautils.fs.promisify.getStatsOfFiles(dir, 1) as FileStat[];
                } catch {
                    resp.error = 'getdir fail';
                    debug(resp.error);
                }
            } break;
            default:
                resp.error = 'file message bad request';
                break;
        }
    }
}
 
