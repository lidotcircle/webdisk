import { Injectable } from '@angular/core';
import { WSChannelService } from './wschannel.service';
import { RPCRequestMessage, MiscMessageType, RPCResponseMessage } from '../common';

const memcache: Map<string, string> = new Map<string, string>();

export enum SVGIconStyle {
    classic = "classic",
    extra = "extra",
    high_contrast = "high-contrast",
    square_o = "square-o",
    vivid = "vivid"
};

const extensionMapping: Map<string, string> = new Map<string, string>([
    ['cc', 'cpp'],
    ['cxx', 'cpp'],
    ['c++', 'cpp'],
]);

@Injectable({
    providedIn: 'root'
})
export class FiletypeSvgIconService {
    constructor(private wschannel: WSChannelService) {}

    async getSvgIcon(ext: string, style: SVGIconStyle = SVGIconStyle.square_o): Promise<string> {
        if(extensionMapping.has(ext)) {
            ext = extensionMapping.get(ext);
        }

        if(memcache.has(ext + style)) {
            return memcache.get(ext + style);
        } else {
            let msg = new RPCRequestMessage();
            msg.misc_type = MiscMessageType.RPC_REQUEST;
            msg.misc_msg.function_name = 'getSvgIcon';
            msg.misc_msg.function_argv = [ext, style];
            let ans = await this.wschannel.send(msg, false) as RPCResponseMessage;

            if(!ans.error && ans.misc_msg?.function_response && 
                ans.misc_msg.function_response.match(/^\<\s*svg\s+.*\>.*\<\s*\/\s*svg\s*\>$/)) {
                memcache.set(ext+style, ans.misc_msg.function_response);
            } else {
                throw new Error('recieve bad icon');
            }

            return ans.misc_msg?.function_response;
        }
    }

    async blank(): Promise<string> {
        return await this.getSvgIcon('blank');
    }

    async folder(): Promise<string> {
        return await this.getSvgIcon('folder');
    }
}

