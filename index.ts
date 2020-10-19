import * as xconfig from './lib/server_config';
import * as websocket from './lib/websocket';
import * as xutil from './lib/util';

export type config      = xconfig.ServerConfig;
export type UserProfile = xconfig.User;

export type Websocket       = websocket.WebsocketM;
export type WebsocketOpcode = websocket.WebsocketOPCode;

export const parseCookie: typeof xutil.parseCookie = xutil.parseCookie;

