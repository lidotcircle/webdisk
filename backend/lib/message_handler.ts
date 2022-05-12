import { BasicMessage } from './common/message/message';
import { MessageGateway } from './message_gateway';


export class MessageHandler {
    constructor() {}

    /** pure virtual function */
    async handleRequest(_dispatcher: MessageGateway, _message: BasicMessage) {throw new Error("not implement");}
}

