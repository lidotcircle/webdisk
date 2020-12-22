import { conf } from './config';
import * as db from './database';
import { MessageHandler } from './message_handler';
import { MessageType, MessageJSON, MessageBIN } from './common/message';
import { error } from './logger';


export const DB: db.Database = new db.Database();
export async function BootstrapService() {
    try { 
        await DB.init(conf.sqlite3Database)
    } catch (err) {
        error('database initialization fail');
        throw err;
    }
}

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

