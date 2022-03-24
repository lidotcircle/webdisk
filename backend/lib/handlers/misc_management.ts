import { MessageHandler } from '../message_handler';
import { MessageGateway } from '../message_gateway';
import { MessageSource } from '../common/message/message';
import { debug, info, warn, error } from '../../service';
import { DownloadManage, DownloadManageDeleteTaskMessage, DownloadManageEventFailMessage, DownloadManageEventFinishMessage, DownloadManageEventMessage, DownloadManageEventUpdateMessage, DownloadManageGetTasksMessage, DownloadManageGetTasksResponseMessage, DownloadManageInspectTaskMessage, DownloadManageMessage, DownloadManageNewTaskMessage, DownloadManageNewTaskResponseMessage, MiscMessage, MiscMessageType, RPCRequestMessage, RPCResponseMessage, StorePasswordMessage, StorePasswordType, StorePasswordTypeChangePassMessage, StorePasswordTypeDeletePassMessage, StorePasswordTypeGetPassMessage, StorePasswordTypeGetPassResponseMessage, StorePasswordTypeNewPassMessage, StorePasswordTypeNewPassResponseMessage } from '../common/message/misc_message';
import isPromise from 'is-promise';
import { startTask } from '../download/download';
import { KEY_DOWNLOAD } from '../database/constants';
import { ErrorMSG } from '../common/string';


const inspectedTask = Symbol('inspected task');

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

        debug('Recieve a MISC Message', msg.misc_type, msg.messageSource);
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

                    /*
                case MiscMessageType.DownloadManage: {
                    assert.notEqual((msg as DownloadManageMessage).dlm_type, null);
                    resp = Object.assign(new DownloadManageMessage(), resp);
                    await this.downloadManage(dispatcher, msg as DownloadManageMessage, resp as DownloadManageMessage);
                } break;

                case MiscMessageType.StorePassword: {
                    resp = Object.assign(new StorePasswordMessage(), resp);
                    await this.passManage(dispatcher, msg as StorePasswordMessage, resp as StorePasswordMessage);
                } break;
                */

                default: {
                    warn('unkonw misc message type, ignore it');
                    return;
                }
            }
        } catch (err) {
            error(err, err.message);
            resp.error = err.message || 'unexpected error';
        }
        
        dispatcher.response(resp);
    } //}

    private async downloadManage(dispatcher: MessageGateway, msg: DownloadManageMessage, resp: DownloadManageMessage) //{
    {
        /*
        debug('Misc DownloadManage Message', msg.dlm_type);
        resp.dlm_type = msg.dlm_type;

        switch(msg.dlm_type) {
            case DownloadManage.NEW_TASK: {
                const dmsg = msg as DownloadManageNewTaskMessage;
                const dresp = resp as DownloadManageNewTaskResponseMessage;
                dresp.misc_msg.task = await startTask(dmsg.misc_msg.token, dmsg.misc_msg.url, dmsg.misc_msg.destination);
            } break;
            case DownloadManage.DELETE_TASK: {
                const dmsg = msg as DownloadManageDeleteTaskMessage;
                await this.DB.DeleteTask(dmsg.misc_msg.token, dmsg.misc_msg.taskId);
            } break;
            case DownloadManage.GET_TASKS: {
                const dmsg = msg as DownloadManageGetTasksMessage;
                const dresp = resp as DownloadManageGetTasksResponseMessage;
                dresp.misc_msg.tasks = await this.DB.QueryTasksByToken(dmsg.misc_msg.token);
            } break;
            case DownloadManage.INSEPECT_TASK: {
                const dmsg = msg as DownloadManageInspectTaskMessage;
                const token = dmsg.misc_msg.token;
                const taskid = dmsg.misc_msg.taskId;

                await this.DB.AssertTaskExists(token, taskid);
                await this.inspectDownloadTask(dispatcher, taskid);
            } break;

            default: throw new Error('unknown download message');
        }
        */
    } //}

    private async inspectDownloadTask(dispatcher: MessageGateway, taskid: number) //{
    {
        const lookingTask = dispatcher[inspectedTask] = dispatcher[inspectedTask] || {};
        if(lookingTask[taskid] !== undefined) {
            throw new Error(ErrorMSG.Exists);
        }

        const update_listener = (table: string, sql: string) => {
            if(table == KEY_DOWNLOAD) {
                const m = sql.match(/downloaded=(\d+).*taskId=(\d+)/);
                if(m && Number(m[2]) == taskid) {
                    const noti = new DownloadManageEventUpdateMessage();
                    noti.misc_msg.size = Number(m[1]);
                    noti.misc_msg.taskid = taskid;
                    dispatcher.notify(noti);
                }

                const u = sql.match(/finish=(\d+).*fail=(\d+).*taskId=(\d+)/);
                if(u && Number(u[3]) == taskid) {
                    let noti: DownloadManageEventMessage;
                    if(Number(u[1]) == 1) {
                        noti = new DownloadManageEventFinishMessage();
                    } else {
                        noti = new DownloadManageEventFailMessage();
                    }
                    noti.misc_msg.taskid = taskid;
                    dispatcher.notify(noti);
                }
            }
        }
    } //}

    private async passManage(dispatcher: MessageGateway, msg: StorePasswordMessage, resp: StorePasswordMessage) //{
    {
        /*
        debug('Recieve StorePass Message: ', msg.sp_type);
        resp.sp_type = msg.sp_type;

        switch(msg.sp_type) {
            case StorePasswordType.GetPass: {
                const gmsg = msg as StorePasswordTypeGetPassMessage;
                const gresp = resp as StorePasswordTypeGetPassResponseMessage;
                gresp.misc_msg.stores = await this.DB.getAllPass(gmsg.misc_msg.token);
            } break;
            case StorePasswordType.NewPass: {
                const gmsg = msg as StorePasswordTypeNewPassMessage;
                const gresp = resp as StorePasswordTypeNewPassResponseMessage;
                gresp.misc_msg.passid = await this.DB.newPass(gmsg.misc_msg.token, 
                    gmsg.misc_msg.store.site,
                    gmsg.misc_msg.store.account,
                    gmsg.misc_msg.store.pass);
            } break;
            case StorePasswordType.DeletePass: {
                const gmsg = msg as StorePasswordTypeDeletePassMessage;
                await this.DB.deletePass(gmsg.misc_msg.token, gmsg.misc_msg.passid);
            } break;
            case StorePasswordType.ChangePass: {
                const gmsg = msg as StorePasswordTypeChangePassMessage;
                await this.DB.changePass(gmsg.misc_msg.token, gmsg.misc_msg.passid, gmsg.misc_msg.pass);
            } break;
        }
        */
    } //}
}
 
export const MiscManager = new MiscManagement();

registerRPC('getSvgIcon', require('./misc_rpc/getSvgIcon').default);

