import { MessageHandler } from './message_handler';
import { MessageType, MessageJSON, MessageBIN } from './common/message/message';

export module MessageSerializer {
    export const JSONSerializer = new MessageJSON();
    export const BINSerializer  = new MessageBIN();
}

