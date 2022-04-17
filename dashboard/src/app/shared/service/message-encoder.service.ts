import { Injectable } from '@angular/core';
import { MessageBIN, MessageJSON, BasicMessage } from '../common';

@Injectable({
    providedIn: 'root'
})
export class MessageEncoderService {
    private m_bin_encoder = new MessageBIN();
    private m_json_encoder = new MessageJSON();

    constructor() {}

    public encode(msg: BasicMessage, json: boolean): string | ArrayBuffer {
        if(json) {
            return this.m_json_encoder.encode(msg);
        } else {
            return this.m_bin_encoder.encode(msg);
        }
    }

    public async decode(raw: string | ArrayBuffer | Blob): Promise<BasicMessage> {
        if((typeof raw) == 'string') {
            return this.m_json_encoder.decode(raw as string);
        } else {
            if (raw instanceof Blob)
                raw = await raw.arrayBuffer();
            return this.m_bin_encoder.decode(raw as ArrayBuffer);
        }
    }
}
