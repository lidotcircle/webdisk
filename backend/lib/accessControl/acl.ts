import * as http from 'http';
import { Injectable } from '../di';
import 'reflect-metadata';

import { BasicMessage } from "../common/message/message";


@Injectable()
export class AccessControl {
    constructor() {}

    async CheckMessage(message: BasicMessage) {}

    async CheckHttpRequest(request: http.IncomingHttpHeaders) {}

    protected registerACL(acl: AccessControl) {
    }
}

