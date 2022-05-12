import { MessageHandler } from '../message_handler';
import { MessageGateway } from '../message_gateway';
import { MessageSource } from '../common/message/message';
import { debug, warn, error } from '../../service';
import { MiscMessage, MiscMessageType, RPCRequestMessage, RPCResponseMessage } from '../common/message/misc_message';
import isPromise from 'is-promise';


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
}
 
export const MiscManager = new MiscManagement();
export default MiscManager;

registerRPC('getSvgIcon', require('./misc_rpc/getSvgIcon').default);

