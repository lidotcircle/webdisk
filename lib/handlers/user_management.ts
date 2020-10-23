import { DB, registerMessageHandler } from '../services';
import { MessageHandler } from '../message_handler';
import { MessageGateway } from '../message_gateway';
import { BasicMessage, MessageType } from '../common/message';
import { UserMessage, UserMessageType, UserMessageGetUserInfoRequest } from '../common/user_message';
import { debug, info, warn, error } from '../logger';

import { UserMessageLoginRequest, UserMessageLoginResponse,
         UserMessageLogoutRequest } from '../common/user_message';

class UserManagement extends MessageHandler {
    private static GMSG = new UserMessage();
    private id: number = 0;

    async handleRequest(dispatcher: MessageGateway, msg: UserMessage) {
        for(let prop in UserManagement.GMSG) {
            if(msg[prop] === undefined) {
                warn('bad user message which doesn\'t contain "', prop, '", ignore it');
                return;
            }
        }

        let resp = new UserMessage();
        resp.messageId = this.id++;
        resp.messageType = MessageType.UserManagement;
        resp.messageAck = msg.messageId;
        resp.error = null;
        resp.um_type = msg.um_type;
        resp.um_msg = {};
        msg.um_msg = msg.um_msg || {};

        switch(msg.um_type) {
            case UserMessageType.Login: {
                const lmsg: UserMessageLoginRequest = msg;
                lmsg.um_msg.username;
                const token = await DB.login(lmsg.um_msg.username, lmsg.um_msg.password);
                if(token == null) {
                    resp.error = 'username or password are wrong';
                } else {
                    (resp as UserMessageLoginResponse).um_msg.token = token;
                }
            } break;
            case UserMessageType.Logout: {
                await DB.logout((msg as UserMessageLogoutRequest).um_msg.token);
            } break;
            case UserMessageType.GetBasicUserInfo: {
                const gmsg: UserMessageGetUserInfoRequest = msg;
                const info = await DB.getUserInfo(gmsg.um_msg.token);
                if(info == null) {
                    resp.error = 'get account message fail';
                } else {
                    resp.um_msg = info;
                }
            } break;
            case UserMessageType.SetBasicUserInfo: {
                // TODO
                resp.error = 'not implement';
            } break;
            default:
                warn('unknown user message type, ignore it');
                return;
        }
    }
}

