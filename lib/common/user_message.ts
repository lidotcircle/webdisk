import { MessageType, MessageId, MessageAck, BasicMessage } from './message';

export enum UserMessageType {
    Uninit = "UNINIT"
}

export class UserMessage extends BasicMessage {
    public um_type: UserMessageType = UserMessageType.Uninit;
    public um_msg: any;
}

