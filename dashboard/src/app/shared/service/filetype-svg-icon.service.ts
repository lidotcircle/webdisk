import { Injectable } from '@angular/core';
import { WSChannelService } from './wschannel.service';
import { RPCRequestMessage, MiscMessageType, RPCResponseMessage } from '../common';
import { UserDBService } from './user-db.service';

const memcache: Map<string, string> = new Map<string, string>();
const failHistoryM: Set<string> = new Set<string>();

export enum SVGIconStyle {
    classic       = "classic",
    extra         = "extra",
    high_contrast = "high-contrast",
    square_o      = "square-o",
    vivid         = "vivid"
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
    constructor(private wschannel: WSChannelService,
                private userDB: UserDBService) {
        this.userDB.createTable({fileicons: "&[extension+style], svgData"});
        this.userDB.createTable({failHistory: "&[extension+style]"});
    }
    private get IconDB() {return this.userDB.table("fileicons");}
    private get FailHistory() {return this.userDB.table("failHistory");}

    async getSvgIcon(ext: string, style: SVGIconStyle = SVGIconStyle.square_o): Promise<string> {
        if(extensionMapping.has(ext)) {
            ext = extensionMapping.get(ext);
        }

        if (failHistoryM.has(ext + '/' + style) ||
           (await this.FailHistory.where({extension: ext, style: style}).toArray()).length > 0) {
            throw new Error('failed');
        }

        if(memcache.has(ext + style)) {
            return memcache.get(ext + style);
        } else {
            try {
                let svg;
                let dbcache = await this.IconDB.where({extension: ext, style: style}).toArray();
                if (dbcache.length > 0) {
                    svg = dbcache[0].svgData;
                    console.assert(svg != null);
                } else {
                    let msg = new RPCRequestMessage();
                    msg.misc_type = MiscMessageType.RPC_REQUEST;
                    msg.misc_msg.function_name = 'getSvgIcon';
                    msg.misc_msg.function_argv = [ext, style];
                    let ans = await this.wschannel.send(msg, false) as RPCResponseMessage;

                    if(!ans.error && ans.misc_msg?.function_response && 
                        ans.misc_msg.function_response.match(/^\<\s*svg\s+.*\>.*\<\s*\/\s*svg\s*\>$/)) {
                        svg = ans.misc_msg.function_response;
                        this.IconDB.add({extension: ext, style: style, svgData: svg}).catch(console.warn);
                    } else {
                        throw new Error('recieve bad icon');
                    }
                }
                memcache.set(ext+style, svg);
                return svg;
            } catch (err) {
                failHistoryM.add(ext + '/' + style);
                this.FailHistory.add({extension: ext, style: style});
                throw err;
            }
        }
    }

    async blank(): Promise<string> {
        return await this.getSvgIcon('blank');
    }

    async folder(): Promise<string> {
        return await this.getSvgIcon('folder');
    }
}

