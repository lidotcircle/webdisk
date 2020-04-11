import * as constants from './constants';
import * as details from './details';
import * as register from './register';
import * as file_manager from './file_manager';

export namespace Detail {
    export let Details = null;
};

export namespace WS {
    export let WebsocketConnection: WebSocket =  null;
    export let WebsocketError: any = "not initialized";
};

export namespace File {
    export let manager: file_manager.FileManager = null;
};

