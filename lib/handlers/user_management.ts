import { DB } from '../services';
import { MessageHandler } from '../message_handler';
import { MessageGateway } from '../message_gateway';
import { BasicMessage, MessageType } from '../common/message';
import { UserMessage, UserMessageType, UserMessageGetUserInfoRequest, UserMessageSetUserInfoRequest, UserMessageChangePasswordRequest, UserMessageGenInvCodeRequest, UserMessaageGetInvCodeRequest, UserMessaageGetInvCodeResponse, UserMessageAddUserRequest, UserMessageRemoveUserRequest } from '../common/user_message';
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
                info(`user: ${lmsg.um_msg.username} try to login`);
                const token = await DB.login(lmsg.um_msg.username, lmsg.um_msg.password);
                if(token == null) {
                    info(`${lmsg.um_msg.username} login fail, wrong password`);
                    resp.error = 'username or password are wrong';
                } else {
                    info(`${lmsg.um_msg.username} login success`);
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
                const gmsg: UserMessageSetUserInfoRequest = msg;
                // TODO
                resp.error = 'not implement';
            } break;

            case UserMessageType.ChangePassword: {
                const gmsg: UserMessageChangePasswordRequest = msg;
                if(!(await DB.changePassword(gmsg.um_msg.token, gmsg.um_msg.oldpass, gmsg.um_msg.newpass))) {
                    resp.error = 'change password fail';
                }
            } break;

            case UserMessageType.GenerateInvitationCode: {
                const gmsg: UserMessageGenInvCodeRequest = msg;
                if(!(await DB.generateInvitationCode(gmsg.um_msg.token, gmsg.um_msg.n))) {
                    resp.error = 'generate new invitationCode fail';
                }
            } break;

            case UserMessageType.GetInvitationCode: {
                const gmsg: UserMessaageGetInvCodeRequest = msg;
                const v = await DB.getInvitationCodes(gmsg.um_msg.token);
                if(v) {
                    const m: UserMessaageGetInvCodeResponse = resp;
                    m.um_msg.InvCodes = v.map(c => c[0]);
                } else {
                    msg.error = 'get invitation codes fail, maybe a invalid token';
                }
            } break;

            case UserMessageType.AddUser: {
                const gmsg: UserMessageAddUserRequest = msg;
                const v = await DB.addUser(gmsg.um_msg.username, gmsg.um_msg.password, gmsg.um_msg.invitationCode);
                if(!v) {
                    resp.error = `add user ${gmsg.um_msg.username} fail`;
                }
            } break;

            case UserMessageType.RemoveUser: {
                const gmsg: UserMessageRemoveUserRequest = msg;
                if(!(await DB.removeUser(gmsg.um_msg.token, gmsg.um_msg.username, gmsg.um_msg.password))) {
                    resp.error = `remove user ${gmsg.um_msg.username} fail`;
                }
            } break;

            default:
                warn('unknown user message type, ignore it');
                return;
        }

        dispatcher.response(resp);
    }
}

export const UserManager = new UserManagement();

