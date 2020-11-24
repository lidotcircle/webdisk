import { Injectable } from '@angular/core';
import { WSChannelService } from './wschannel.service';
import { RPCRequestMessage, MiscMessageType, RPCResponseMessage } from '../common';

const memcache: Map<string, string> = new Map<string, string>();


@Injectable({
    providedIn: 'root'
})
export class FiletypeSvgIconService {
    constructor(private wschannel: WSChannelService) {}

    async getSvgIcon(ext: string): Promise<string> {
        if(memcache.has(ext)) {
            return memcache.get(ext);
        } else {
            let msg = new RPCRequestMessage();
            msg.misc_type = MiscMessageType.RPC_REQUEST;
            msg.misc_msg.function_name = 'getSvgIcon';
            msg.misc_msg.function_argv = [ext];
            let ans = await this.wschannel.send(msg, false) as RPCResponseMessage;
            return ans.misc_msg?.function_response;
        }
    }
}

