/** define message for client and server communication */

export enum MessageType {
    UserManagement = "USER_MANAGEMENT",
    FileManagement = "FILE_MANAGEMENT",
    Uninit = "UNINIT"
}
export type MessageId  = number;
export type MessageAck = number;

export class BasicMessage {
    public messageType: MessageType = MessageType.Uninit;
    public messageId:   MessageId   = -1;
    public messageAck:  MessageAck  = -1;
    public error: string | null     = null;
}

export class MessageJSON {
    encode(msg: BasicMessage): string {
        return JSON.stringify(msg, null, 2);
    }

    decode(msg: string): BasicMessage {
        const o = JSON.parse(msg);
        for (let key in new BasicMessage()) {
            if (o[key] === undefined) {
                return null;
            }
        }
        return o;
    }
}

export class MessageBIN {
}

