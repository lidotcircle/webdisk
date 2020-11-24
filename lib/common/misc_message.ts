import { MessageType, BasicMessage } from './message';

export enum MiscMessageType {
    RPC_REQUEST  = "RPC_REQUEST",
    RPC_RESPONSE = "RPC_RESPONSE",
    Uninit   = "UNINIT"
}

export class MiscMessage extends BasicMessage {
    public messageType = MessageType.MiscManagement;
    public misc_type: MiscMessageType = MiscMessageType.Uninit;
    public misc_msg: any = null;
}

export class RPCRequestMessage extends MiscMessage {
    misc_msg = {
        function_name: '',
        function_argv: []
    }
}

export class RPCResponseMessage extends MiscMessage {
    misc_msg = {
        function_response: null
    }
}

