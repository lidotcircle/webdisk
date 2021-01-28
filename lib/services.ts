import { conf } from './config';
import { Database } from './database';
import { MessageHandler } from './message_handler';
import { MessageType, MessageJSON, MessageBIN } from './common/message';
import { error } from './logger';
import { FileSystem } from './fileSystem/fileSystem';
import { AccessControl } from './accessControl/acl';


// Database
export const DB: Database = conf.DB;

// File System Abstraction
export const filesystem: FileSystem = conf.FSAbstraction;

// Access Control
export const acl: AccessControl = new AccessControl();


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

