import { MessageType, MessageId, MessageAck, BasicMessage } from './message';
import { UserInfo, Token } from './db_types';

export enum UserMessageType {
    Login = "LOGIN",
    Logout = "LOGOUT",

    GetBasicUserInfo = "GetUserInfo",
    SetBasicUserInfo = "SetUserInfo",

    Uninit = "UNINIT"
}

export class UserMessage extends BasicMessage {
    public um_type: UserMessageType = UserMessageType.Uninit;
    public um_msg: any;
}

export interface UserMessageLoginRequest extends UserMessage {
    um_msg: {
        username: string,
        password: string
    }
}
export interface UserMessageLoginResponse extends UserMessage {
    um_msg: {
        token: Token
    }
}
export interface UserMessageLogoutRequest extends UserMessageLoginResponse {}

export interface UserMessageGetUserInfoRequest  extends UserMessageLoginResponse {}
export interface UserMessageGetUserInfoResponse extends UserMessage {
    um_msg: UserInfo
}

export interface UserMessageSetUserInfoRequest extends UserMessage {
    um_msg: {
        token: Token,
        newInfo: UserInfo
    }
}

