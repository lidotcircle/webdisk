import { MessageHandler } from './message_handler';
import { MessageType, MessageJSON, MessageBIN } from './common/message/message';

export const MessageHandlers: Map<MessageType, MessageHandler> = new Map<MessageType, MessageHandler>();
export function registerMessageHandler(msg_type: MessageType, handler: MessageHandler) {
    if(MessageHandlers.has(msg_type)) {
        throw new Error("double handler to a message type is prohibit");
    }
    MessageHandlers.set(msg_type, handler);
}

export module MessageSerializer {
    export const JSONSerializer = new MessageJSON();
    export const BINSerializer  = new MessageBIN();
}

