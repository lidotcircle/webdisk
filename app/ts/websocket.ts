import { WS } from './global_vars';
import { debug } from './util';

export function SetupWS() {
    WS.WebsocketConnection = new WebSocket(`ws://${location.host}`);
    let ws = WS.WebsocketConnection;
    ws.addEventListener("message", (msg) => {
//        debug("recieve message: ", msg.data);
    });
    window["wsss"] = ws; // TODO
    ws.onopen  = () => console.log("ws opened");
    ws.onclose = () => console.log("ws closed");
    ws.onerror = () => console.log("ws error");
    WS.WebsocketError = null;
}
