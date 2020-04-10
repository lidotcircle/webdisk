import { WS } from './global_vars';

export function SetupWS() {
    WS.WebsocketConnection = new WebSocket(`ws://${location.host}`);
    WS.WebsocketError = null;
}

