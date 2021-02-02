import { DB, service } from '../services';
import { MessageHandler } from '../message_handler';
import { MessageGateway } from '../message_gateway';
import { BasicMessage, MessageSource, MessageType } from '../common/message/message';
import { debug, info, warn, error } from '../logger';
import { DownloadManage, DownloadManageDeleteTaskMessage, DownloadManageEventFailMessage, DownloadManageEventFinishMessage, DownloadManageEventMessage, DownloadManageEventUpdateMessage, DownloadManageGetTasksMessage, DownloadManageGetTasksResponseMessage, DownloadManageInspectTaskMessage, DownloadManageMessage, DownloadManageNewTaskMessage, DownloadManageNewTaskResponseMessage, MiscMessage, MiscMessageType, RPCRequestMessage, RPCResponseMessage } from '../common/message/misc_message';
import isPromise from 'is-promise';
import * as download from '../download/download';
import assert from 'assert';
import { startTask } from '../download/download';
import { KEY_DOWNLOAD } from '../database/constants';


const RPCHandlers: Map<string, Function> = new Map<string, Function>();
export function registerRPC(funcname: string, func: Function): boolean {
    if(RPCHandlers.has(funcname)) {
        warn('duplicated misc rpc handler');
        return false;
    } else if (typeof(func) !== 'function') {
        warn(`bad handler for ${funcname}`);
        return false;
    }
    RPCHandlers.set(funcname, func);
    return true;
}

class MiscManagement extends MessageHandler {
    private static GMSG = new MiscMessage();
    private id: number = 0;

    async handleRequest(dispatcher: MessageGateway, msg: MiscMessage) //{
    {
        for(let prop in MiscManagement.GMSG) {
            if(msg[prop] === undefined) {
                warn('bad misc message which doesn\'t contain "', prop, '", ignore it');
                return;
            }
        }


        let resp = new MiscMessage();
        resp.messageId = this.id++;
        resp.messageSource = MessageSource.Response;
        resp.messageAck = msg.messageId;
        resp.misc_type = msg.misc_type;
        resp.error = null;
        msg.misc_msg = msg.misc_msg || {};

        try {
            if(msg.messageSource != MessageSource.Request) {
                throw new Error('bad request');
            }

            switch(msg.misc_type) {
                case MiscMessageType.RPC: {
                    const rpc_req = msg as RPCRequestMessage;
                    const h = RPCHandlers.get(rpc_req.misc_msg.function_name) as Function;
                    let rpc_await_ans = null;
                    if(!!h) {
                        const rpc_ans = h(...rpc_req.misc_msg.function_argv);
                        if(isPromise(rpc_ans)) {
                            rpc_await_ans = await rpc_ans;
                        } else {
                            rpc_await_ans = rpc_ans;
                        }
                        const rpc_resp = resp as RPCResponseMessage;
                        rpc_resp.misc_msg = rpc_resp.misc_msg || {function_response: null};
                        rpc_resp.misc_msg.function_response = rpc_await_ans;
                    } else {
                        throw new Error(`rpc without handler: ${rpc_req.misc_msg.function_name}`);
                    }
                } break;

                case MiscMessageType.DownloadManage: {
                    assert.notEqual((msg as DownloadManageMessage).dlm_type, null);
                    resp = Object.assign(new DownloadManageMessage(), resp);
                    await this.downloadManage(dispatcher, msg as DownloadManageMessage, resp as DownloadManageMessage);
                } break;

                default: {
                    warn('unkonw misc message type, ignore it');
                    return;
                }
            }
        } catch (err) {
            resp.error = err.message || 'unexpected error';
        }
        
        dispatcher.response(resp);
    } //}

    private async downloadManage(dispatcher: MessageGateway, msg: DownloadManageMessage, resp: DownloadManageMessage) //{
    {
        resp.dlm_type = msg.dlm_type;

        switch(msg.dlm_type) {
            case DownloadManage.NEW_TASK: {
                const dmsg = msg as DownloadManageNewTaskMessage;
                const dresp = resp as DownloadManageNewTaskResponseMessage;
                dresp.misc_msg.task = await startTask(dmsg.misc_msg.token, dmsg.misc_msg.url, dmsg.misc_msg.destination);
                await this.inspectDownloadTask(dispatcher, dresp.misc_msg.task.taskId);
            } break;
            case DownloadManage.DELETE_TASK: {
                const dmsg = msg as DownloadManageDeleteTaskMessage;
                await service.DB.DeleteTask(dmsg.misc_msg.token, dmsg.misc_msg.taskId);
            } break;
            case DownloadManage.GET_TASKS: {
                const dmsg = msg as DownloadManageGetTasksMessage;
                const dresp = resp as DownloadManageGetTasksResponseMessage;
                dresp.misc_msg.tasks = await service.DB.QueryTasksByToken(dmsg.misc_msg.token);
            } break;
            case DownloadManage.INSEPECT_TASK: {
                const dmsg = msg as DownloadManageInspectTaskMessage;
                const token = dmsg.misc_msg.token;
                const taskid = dmsg.misc_msg.taskId;

                await service.DB.AssertTaskExists(token, taskid);
                await this.inspectDownloadTask(dispatcher, taskid);
            } break;

            default: throw new Error('unknown download message');
        }
    } //}

    private async inspectDownloadTask(dispatcher: MessageGateway, taskid: number) //{
    {
        const update_listener = (table: string, sql: string) => {
            if(table == KEY_DOWNLOAD) {
                const m = sql.match(/size=(\d+).*taskId=(\d+)/);
                if(m && Number(m[2]) == taskid) {
                    const noti = new DownloadManageEventUpdateMessage();
                    noti.misc_msg.size = Number(m[1]);
                    noti.misc_msg.taskid = taskid;
                    dispatcher.notify(noti);
                }

                const u = sql.match(/finish=(\d+).*fail(\d+).*taskId=(\d+)/);
                if(u && Number(u[3]) == taskid) {
                    let noti: DownloadManageEventMessage;
                    if(Number(u[1]) == 1) {
                        noti = new DownloadManageEventFinishMessage();
                    } else {
                        noti = new DownloadManageEventFailMessage();
                    }
                    dispatcher.notify(noti);
                }
            }
        }
        await service.DB.on('update', update_listener);
        dispatcher.once('close', () => {
            service.DB.removeListener('update', update_listener);
        });
    } //}
}
 
export const MiscManager = new MiscManagement();

registerRPC('getSvgIcon', require('./misc_rpc/getSvgIcon').default);

