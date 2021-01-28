import { conf } from './config';
import { Database } from './database';
import { MessageHandler } from './message_handler';
import { MessageType, MessageJSON, MessageBIN } from './common/message';
import { error } from './logger';
import { FileSystem } from './fileSystem/fileSystem';
import { AccessControl } from './accessControl/acl';


export const DB: Database = conf.DB;
class Service {
    // Database
    get DB(): Database {return conf.DB;}

    // File System Abstraction
    get filesystem(): FileSystem {return conf.FSAbstraction;}

    // Access Control
    private _acl = new AccessControl();
    get acl(): AccessControl {return this._acl;}
}
export const service = new Service();


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

