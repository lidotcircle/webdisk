import { DB } from '../services';
import { MessageHandler } from '../message_handler';
import { MessageGateway } from '../message_gateway';
import { BasicMessage, MessageType } from '../common/message';
import { UserMessage, UserMessageType, UserMessageGetUserInfoRequest, UserMessageSetUserInfoRequest, UserMessageChangePasswordRequest, UserMessageGenInvCodeRequest, UserMessaageGetInvCodeRequest, UserMessaageGetInvCodeResponse, UserMessageAddUserRequest, UserMessageRemoveUserRequest, UserMessageGetUserSettingsRequest, UserMessageGetUserSettingsResponse, UserMessageUpdateUserSettingsRequest, UserMessageShortTermTokenGenerateRequest, UserMessageShortTermTokenGenerateResponse, UserMessageShortTermTokenClearRequest, UserMessageNewNameEntryRequest, UserMessageGetNameEntryRequest, UserMessageGetNameEntryResponse, UserMessageGetAllNameEntryRequest, UserMessageGetAllNameEntryResponse, UserMessageDeleteNameEntryRequest, UserMessageDeleteAllNameEntryRequest } from '../common/user_message';
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
        resp.messageAck = msg.messageId;
        resp.error = null;
        resp.um_type = msg.um_type;
        resp.um_msg = {};
        msg.um_msg = msg.um_msg || {};

        debug(`USER Manager: recieve ${msg.um_type} request`);

        try {
            switch(msg.um_type) {
                case UserMessageType.Login: {
                    const lmsg: UserMessageLoginRequest = msg;
                    lmsg.um_msg.username;
                    info(`user: ${lmsg.um_msg.username} try to login`);
                    const token = await DB.login(lmsg.um_msg.username, lmsg.um_msg.password);
                    if(token == null) {
                        info(`${lmsg.um_msg.username} login fail, wrong password`);
                        throw new Error('username or password are wrong');
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
                        throw new Error('get account message fail');
                    } else {
                        resp.um_msg = info;
                    }
                } break;

                case UserMessageType.SetBasicUserInfo: {
                    const gmsg: UserMessageSetUserInfoRequest = msg;
                    // TODO
                    throw new Error('set userinf onot implement');
                } break;

                case UserMessageType.ChangePassword: {
                    const gmsg: UserMessageChangePasswordRequest = msg;
                    if(!(await DB.changePassword(gmsg.um_msg.token, gmsg.um_msg.oldpass, gmsg.um_msg.newpass))) {
                        throw new Error('change password fail');
                    }
                } break;

                case UserMessageType.GenerateInvitationCode: {
                    const gmsg: UserMessageGenInvCodeRequest = msg;
                    if(!(await DB.generateInvitationCode(gmsg.um_msg.token, gmsg.um_msg.n))) {
                        throw new Error('generate new invitationCode fail');
                    }
                } break;

                case UserMessageType.GetInvitationCode: {
                    const gmsg: UserMessaageGetInvCodeRequest = msg;
                    const v = await DB.getInvitationCodes(gmsg.um_msg.token);
                    if(v) {
                        const m: UserMessaageGetInvCodeResponse = resp;
                        m.um_msg.InvCodes = v.map(c => c[0]);
                    } else {
                        throw new Error('get invitation codes fail, maybe a invalid token');
                    }
                } break;

                case UserMessageType.AddUser: {
                    const gmsg: UserMessageAddUserRequest = msg;
                    const v = await DB.addUser(gmsg.um_msg.username, gmsg.um_msg.password, gmsg.um_msg.invitationCode);
                    if(!v) {
                        throw new Error(`add user ${gmsg.um_msg.username} fail`);
                    }
                } break;

                case UserMessageType.RemoveUser: {
                    const gmsg: UserMessageRemoveUserRequest = msg;
                    if(!(await DB.removeUser(gmsg.um_msg.token, gmsg.um_msg.username, gmsg.um_msg.password))) {
                        throw new Error(`remove user ${gmsg.um_msg.username} fail`);
                    }
                } break;

                case UserMessageType.GetUserSettings: {
                    const gmsg: UserMessageGetUserSettingsRequest = msg;
                    const settings = await DB.getUserSettings(gmsg.um_msg.token);
                    (resp as UserMessageGetUserSettingsResponse).um_msg.userSettings = settings;
                } break;

                case UserMessageType.UpdateUserSettings: {
                    const gmsg: UserMessageUpdateUserSettingsRequest = msg;
                    if (!(await DB.updateUserSettings(gmsg.um_msg.token, gmsg.um_msg.userSettings))) {
                        throw new Error(`update user settings fail`);
                    }
                } break;

                case UserMessageType.ShortTermTokenGenerate: {
                    const gmsg: UserMessageShortTermTokenGenerateRequest = msg;
                    const shortTermToken = await DB.RequestShortTermToken(gmsg.um_msg.token);
                    (resp as UserMessageShortTermTokenGenerateResponse).um_msg.shortTermToken = shortTermToken;
                } break;

                case UserMessageType.ShortTermTokenClear: {
                    const gmsg: UserMessageShortTermTokenClearRequest = msg;
                    await DB.DeleteShortTermToken(gmsg.um_msg.token);
                } break;

                case UserMessageType.NewNameEntry: {
                    const gmsg: UserMessageNewNameEntryRequest = msg;
                    await DB.newEntryMapping(gmsg.um_msg.token, gmsg.um_msg.name,
                                             gmsg.um_msg.destination, 
                                             gmsg.um_msg.validPeriodMS);
                } break;

                case UserMessageType.GetNameEntry: {
                    const gmsg: UserMessageGetNameEntryRequest = msg;
                    const q = await DB.queryNameEntry(gmsg.um_msg.token, gmsg.um_msg.name);
                    (resp as UserMessageGetNameEntryResponse).um_msg.entry = q;
                } break;

                case UserMessageType.GetAllNameEntry: {
                    const gmsg: UserMessageGetAllNameEntryRequest = msg;
                    const q = await DB.queryAllNameEntry(gmsg.um_msg.token);
                    (resp as UserMessageGetAllNameEntryResponse).um_msg.entries = q;
                } break;

                case UserMessageType.DeleteNameEntry: {
                    const gmsg: UserMessageDeleteNameEntryRequest = msg;
                    await DB.deleteNameEntry(gmsg.um_msg.token, gmsg.um_msg.name);
                } break;

                case UserMessageType.DeleteAllNameEntry: {
                    const gmsg: UserMessageDeleteAllNameEntryRequest = msg;
                    await DB.deleteAllNameEntry(gmsg.um_msg.token);
                } break;

                default:
                    warn('unknown user message type, ignore it');
                    return;
            }
        } catch (err) {
            if(err instanceof Error) {
                err = {
                    message: err.message,
                    stack: err.stack,
                    name: err.name
                }
            }
            warn(`USER MESSAGE ${msg.um_type}:`, err);
            resp.error = err;
        }

        dispatcher.response(resp);
    }
}

export const UserManager = new UserManagement();

