import * as constants from './constants';
import * as details from './details';
import * as register from './register';

export namespace Detail {
    export let Details = new details.Detail(constants.detail_page as HTMLDivElement, register.upload);
};

export namespace WS {
    export let WebsocketConnection: WebSocket =  null;
    export let WebsocketError: any = "not initialized";
};
