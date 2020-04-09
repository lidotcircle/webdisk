import * as xconfig from './lib/server_config';
import * as xparser from './lib/parse_html_inlinejs';
import * as websocket from './lib/websocket';

export type config          = xconfig.ServerConfig;
export type HtmlParser      = xparser.HTMLInlineJSParser;
export const parseHtml      = xparser.parseHTMLNewProc;
export const include        = xparser.include;
export type Websocket       = websocket.WebsocketM;
export type WebsocketOpcode = websocket.WebsocketOPCode;

