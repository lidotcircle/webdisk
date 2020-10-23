import { BasicMessage } from './common/message';
import { MessageGateway } from './message_gateway';


export class MessageHandler {
    constructor() {}

    /** pure virtual function */
    async handleRequest(dispatcher: MessageGateway, message: BasicMessage) {throw new Error("not implement");}
}

