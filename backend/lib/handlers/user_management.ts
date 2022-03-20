import { MessageHandler } from '../message_handler';
import { MessageGateway } from '../message_gateway';
import { BasicMessage, MessageSource, MessageType } from '../common/message/message';
import { UserMessage, UserMessageType, UserMessageGetUserInfoRequest, UserMessageSetUserInfoRequest, UserMessageChangePasswordRequest, UserMessageGenInvCodeRequest, UserMessaageGetInvCodeRequest, UserMessaageGetInvCodeResponse, UserMessageAddUserRequest, UserMessageRemoveUserRequest, UserMessageGetUserSettingsRequest, UserMessageGetUserSettingsResponse, UserMessageUpdateUserSettingsRequest, UserMessageShortTermTokenGenerateRequest, UserMessageShortTermTokenGenerateResponse, UserMessageShortTermTokenClearRequest, UserMessageNewNameEntryRequest, UserMessageGetNameEntryRequest, UserMessageGetNameEntryResponse, UserMessageGetAllNameEntryRequest, UserMessageGetAllNameEntryResponse, UserMessageDeleteNameEntryRequest, UserMessageDeleteAllNameEntryRequest, UserMessaageDeleteInvCodeRequest, UserMessageGetPermissionRequest, UserMessageGetPermissionResponse, UserMessageSetPermissionRequest, UserMessageGetUserInfoByInvCodeRequest, UserMessageGetUserInfoByInvCodeResponse } from '../common/message/user_message';
import { debug, info, warn, error } from '../logger';

import { UserMessageLoginRequest, UserMessageLoginResponse,
         UserMessageLogoutRequest } from '../common/message/user_message';
import { WDDatabase, Database } from '../database/database';
import { DIProperty, Injectable } from '../di';


@Injectable()
class UserManagement extends MessageHandler {
    private static GMSG = new UserMessage();
    private id: number = 0;

    @DIProperty(WDDatabase)
    private DB: Database;

    async handleRequest(dispatcher: MessageGateway, msg: UserMessage) {
        for(let prop in UserManagement.GMSG) {
            if(msg[prop] === undefined) {
                warn('bad user message which doesn\'t contain "', prop, '", ignore it');
                return;
            }
        }

        let resp = new UserMessage();
        resp.messageSource = MessageSource.Response;
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
                    info(`user: ${lmsg.um_msg.username} try to login`);
                    const token = await this.DB.login(lmsg.um_msg.username, lmsg.um_msg.password);
                    info(`${lmsg.um_msg.username} login success`);
                    (resp as UserMessageLoginResponse).um_msg.token = token;
                } break;

                case UserMessageType.Logout: {
                    await this.DB.logout((msg as UserMessageLogoutRequest).um_msg.token);
                } break;

                case UserMessageType.GetBasicUserInfo: {
                    const gmsg: UserMessageGetUserInfoRequest = msg;
                    resp.um_msg = await this.DB.getUserInfo(gmsg.um_msg.token);
                } break;

                case UserMessageType.SetBasicUserInfo: {
                    const gmsg: UserMessageSetUserInfoRequest = msg;
                    // TODO
                    throw new Error('set userinf onot implement');
                } break;

                case UserMessageType.ChangePassword: {
                    const gmsg: UserMessageChangePasswordRequest = msg;
                    await this.DB.changePassword(gmsg.um_msg.token, gmsg.um_msg.oldpass, gmsg.um_msg.newpass);
                } break;

                case UserMessageType.GenerateInvitationCode: {
                    const gmsg: UserMessageGenInvCodeRequest = msg;
                    await this.DB.generateInvitationCode(gmsg.um_msg.token, gmsg.um_msg.n);
                } break;

                case UserMessageType.GetInvitationCode: {
                    const gmsg: UserMessaageGetInvCodeRequest = msg;
                    const v = await this.DB.getInvitationCodes(gmsg.um_msg.token);
                    const m: UserMessaageGetInvCodeResponse = resp;
                    m.um_msg.InvCodes = v.map(c => c[0]);
                } break;

                case UserMessageType.DeleteInvitationCode: {
                    const gmsg: UserMessaageDeleteInvCodeRequest = msg;
                    await this.DB.deleteInvitationCode(gmsg.um_msg.token, gmsg.um_msg.InvCode);
                } break;

                case UserMessageType.AddUser: {
                    const gmsg: UserMessageAddUserRequest = msg;
                    await this.DB.addUser(gmsg.um_msg.username, gmsg.um_msg.password, gmsg.um_msg.invitationCode);
                } break;

                case UserMessageType.RemoveUser: {
                    const gmsg: UserMessageRemoveUserRequest = msg;
                    await this.DB.removeUser(gmsg.um_msg.token, gmsg.um_msg.username, gmsg.um_msg.password);
                } break;

                case UserMessageType.GetUserSettings: {
                    const gmsg: UserMessageGetUserSettingsRequest = msg;
                    const settings = await this.DB.getUserSettings(gmsg.um_msg.token);
                    (resp as UserMessageGetUserSettingsResponse).um_msg.userSettings = settings;
                } break;

                case UserMessageType.UpdateUserSettings: {
                    const gmsg: UserMessageUpdateUserSettingsRequest = msg;
                    await this.DB.setUserSettings(gmsg.um_msg.token, gmsg.um_msg.userSettings);
                } break;

                case UserMessageType.ShortTermTokenGenerate: {
                    const gmsg: UserMessageShortTermTokenGenerateRequest = msg;
                    const shortTermToken = await this.DB.RequestShortTermToken(gmsg.um_msg.token);
                    (resp as UserMessageShortTermTokenGenerateResponse).um_msg.shortTermToken = shortTermToken;
                } break;

                case UserMessageType.ShortTermTokenClear: {
                    const gmsg: UserMessageShortTermTokenClearRequest = msg;
                    await this.DB.DeleteShortTermToken(gmsg.um_msg.token);
                } break;

                case UserMessageType.NewNameEntry: {
                    const gmsg: UserMessageNewNameEntryRequest = msg;
                    await this.DB.newEntryMapping(gmsg.um_msg.token, gmsg.um_msg.name,
                                             gmsg.um_msg.destination, 
                                             gmsg.um_msg.validPeriodMS);
                } break;

                case UserMessageType.GetNameEntry: {
                    const gmsg: UserMessageGetNameEntryRequest = msg;
                    const q = await this.DB.queryNameEntry(gmsg.um_msg.token, gmsg.um_msg.name);
                    (resp as UserMessageGetNameEntryResponse).um_msg.entry = q;
                } break;

                case UserMessageType.GetAllNameEntry: {
                    const gmsg: UserMessageGetAllNameEntryRequest = msg;
                    const q = await this.DB.queryAllNameEntry(gmsg.um_msg.token);
                    (resp as UserMessageGetAllNameEntryResponse).um_msg.entries = q;
                } break;

                case UserMessageType.DeleteNameEntry: {
                    const gmsg: UserMessageDeleteNameEntryRequest = msg;
                    await this.DB.deleteNameEntry(gmsg.um_msg.token, gmsg.um_msg.name);
                } break;

                case UserMessageType.DeleteAllNameEntry: {
                    const gmsg: UserMessageDeleteAllNameEntryRequest = msg;
                    await this.DB.deleteAllNameEntry(gmsg.um_msg.token);
                } break;

                case UserMessageType.GetPermission: {
                    const gmsg: UserMessageGetPermissionRequest = msg;
                    const ans = await this.DB.getPermission(gmsg.um_msg.token, gmsg.um_msg.invCode);
                    (resp as UserMessageGetPermissionResponse).um_msg.perm = ans;
                } break;

                case UserMessageType.SetPermission: {
                    const gmsg: UserMessageSetPermissionRequest = msg;
                    await this.DB.setPermission(gmsg.um_msg.token, gmsg.um_msg.invCode, gmsg.um_msg.perm);
                } break;

                case UserMessageType.GetUserinfoByInvCode: {
                    const gmsg: UserMessageGetUserInfoByInvCodeRequest = msg;
                    const ans = await this.DB.getUserinfoByInvcode(gmsg.um_msg.token, gmsg.um_msg.invCode);
                    (resp as UserMessageGetUserInfoByInvCodeResponse).um_msg.info = ans;
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
            warn(`USER MESSAGE ${msg.um_type}:`, String(err));
            resp.error = err;
        }

        dispatcher.response(resp);
    }
}

export const UserManager = new UserManagement();

