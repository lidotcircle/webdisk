import { DB } from '../services';
import { MessageHandler } from '../message_handler';
import { MessageGateway } from '../message_gateway';
import { BasicMessage, MessageType } from '../common/message';
import { debug, info, warn, error } from '../logger';
import { MiscMessage, MiscMessageType, RPCRequestMessage, RPCResponseMessage } from '../common/misc_message';
import isPromise from 'is-promise';
import * as download from '../download/download';

setTimeout(() => {
    download.startTask('https://v.hoopchina.com.cn/hupuapp/bbs/687/17183687/thread__17183687_20210131073820_8407.mp4?auth_key=1612085266-0-0-aaa22ebad6b1e3f46e6e38d67e457e1f');
}, 1000);

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

    async handleRequest(dispatcher: MessageGateway, msg: MiscMessage) {
        for(let prop in MiscManagement.GMSG) {
            if(msg[prop] === undefined) {
                warn('bad misc message which doesn\'t contain "', prop, '", ignore it');
                return;
            }
        }

        let resp = new MiscMessage();
        resp.messageId = this.id++;
        resp.messageAck = msg.messageId;
        resp.error = null;
        msg.misc_msg = msg.misc_msg || {};

        switch(msg.misc_type) {
            case MiscMessageType.RPC_REQUEST: {
                const rpc_req = msg as RPCRequestMessage;
                const h = RPCHandlers.get(rpc_req.misc_msg.function_name) as Function;
                let rpc_await_ans = null;
                if(!!h) {
                    try {
                        const rpc_ans = h(...rpc_req.misc_msg.function_argv);
                        if(isPromise(rpc_ans)) {
                            rpc_await_ans = await rpc_ans;
                        } else {
                            rpc_await_ans = rpc_ans;
                        }
                        const rpc_resp = resp as RPCResponseMessage;
                        rpc_resp.misc_msg = rpc_resp.misc_msg || {function_response: null};
                        rpc_resp.misc_msg.function_response = rpc_await_ans;
                    } catch (err) {
                        resp.error = err;
                    }
                } else {
                    resp.error = `rpc without handler: ${rpc_req.misc_msg.function_name}`;
                };
            } break;
            case MiscMessageType.RPC_RESPONSE: {
                warn('bad misc message');
                resp.error = 'bad misc message type';
            } break;
            default: {
                warn('unkonw misc message type, ignore it');
                return;
            }
        }
        
        dispatcher.response(resp);
    }
}
 
export const MiscManager = new MiscManagement();

registerRPC('getSvgIcon', require('./misc_rpc/getSvgIcon').default);

