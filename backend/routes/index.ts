import express, { NextFunction, Request, Response } from 'express';
import assert from 'assert';
import { QueryDependency } from '../lib/di';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createWebSocketMiddleware, createPasswordAuthMiddleware, defaultJWTAuthMiddleware, AnyOfNoError } from '../middleware';
import { MessageGateway } from '../lib/message_gateway';
import { Server } from 'http';
import path from 'path';
import fs from 'fs';

const router = express.Router();
export default router;
const jwt_validator = defaultJWTAuthMiddleware;

// Because it's impossible to get httpserver before app.listen,
// we have to use below queue to register listen callback for.
// subscribing upgrade event of httpserver.
const callback_list = QueryDependency("listen-callback") as any[];

router.use('/apis/auth',       require('./auth').default);
router.use('/apis/user',       jwt_validator, require('./user').default);
router.use('/apis/passstore',  jwt_validator, require('./passstore').default);
router.use('/apis/named-link', jwt_validator, require('./namedlinks').default);
router.use('/apis/stoken',     
           AnyOfNoError(
               createPasswordAuthMiddleware("username", "password"), 
               defaultJWTAuthMiddleware
           ), require('./stoken').default);
router.use('/apis/flink',     require('./filelink').default);
router.use('/apis/sdata',     require('./sdata').default);
router.use('/apis/admin',     require('./admin').default);
router.use('/disk',           require('./disk').default);
router.use('/link',           require('./namedlink').default);
const ws_router = createWebSocketMiddleware(/\/ws/, conn => new MessageGateway(conn));
callback_list.push((server: Server) => server.on("upgrade", ws_router["upgrade"]));
router.use('/ws',   ws_router);

const webroot = QueryDependency("webroot") as string;
assert(webroot, "require webroot to serve static files");
if (webroot.startsWith("http")) {
    const proxy = createProxyMiddleware(
        url => !url.startsWith("/ws"), 
        { target: webroot, changeOrigin: true, ws: true });
    callback_list.push((server: Server) => server.on("upgrade", proxy["upgrade"]));
    router.use("/", proxy);
} else {
    const StaticFileCaches: Set<string> = new Set();
    router.use("/", async (req: Request, res: Response, next: NextFunction) => {
        if (StaticFileCaches.has(req.url))
            return next();
        const file = path.join(webroot, req.url);
        try {
            await fs.promises.stat(file);
            StaticFileCaches.add(req.url);
            return next();
        } catch {
            return res.status(200).sendFile(path.join(webroot, 'index.html'));
        }
    }, express.static(webroot, { etag: true }));
}
