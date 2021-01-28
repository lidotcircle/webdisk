import * as http from 'http';

import { BasicMessage } from "../common/message";


export class AccessControl {
    async CheckMessage(message: BasicMessage) {}

    async CheckHttpRequest(request: http.IncomingHttpHeaders) {}
}

