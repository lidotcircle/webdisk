import { request, connection } from 'websocket';
import { RequestHandler, Request, Response, NextFunction } from 'express';
import { Server, IncomingMessage } from 'http';
import { Socket } from 'net';


type Filter = (path: string, req: IncomingMessage) => boolean;
class WebSocketMiddleware {
    private ws_handler: (conn: connection) => void;
    private ws_subscribed: boolean;
    private conn_filter: Filter;

    constructor(filter: Filter | RegExp, handler: (conn: connection) => void) {
        if (filter instanceof RegExp) {
            this.conn_filter = (path: string, _: Request) => {
                return filter.test(path);
            };
        } else if (filter instanceof Function) {
            this.conn_filter = filter;
        } else {
            this.conn_filter = (_: string, __: Request) => {
                return true;
            };
        }

        this.ws_handler = handler;
        this.ws_subscribed = false;
        (this.middleware as any).upgrade = (req: any, socket: any, head: any) => {
            if (!this.ws_subscribed) {
                this.handleUpgrade(req, socket, head);
            }
        }
    }

    private handleUpgrade = (req: IncomingMessage, socket: Socket, _: any) => {
        if (!this.conn_filter(req.url, req))
            return;

        const wsreq = new request(socket, req, {
            httpServer: null, 
            assembleFragments: true, 
            keepalive: true,
            keepaliveInterval: 3000
        });
        try {
            wsreq.readHandshake();
        } catch {
            wsreq.reject();
            return;
        }
        const connection = wsreq.accept();
        this.ws_handler(connection);
    }

    public middleware: RequestHandler = async (
        req: Request,
        _: Response,
        next: NextFunction
    ) => {
        const server: Server = ((req.socket ?? req.connection) as any)?.server;
        if (!this.ws_subscribed) {
            server.on('upgrade', this.handleUpgrade);
            this.ws_subscribed = true;
        }

        if (req.headers.upgrade != 'websocket') {
            next();
            return;
        }
    }
};

export function createWebSocketMiddleware(filter: Filter | RegExp, handler: (conn: connection) => void) {
    const { middleware } =  new WebSocketMiddleware(filter, handler);
    return middleware;
}
