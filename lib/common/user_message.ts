import { MessageType, MessageId, MessageAck, BasicMessage } from './message';

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

