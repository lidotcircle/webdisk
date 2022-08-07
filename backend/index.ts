import express, { Request, Response, NextFunction } from 'express';
import { initializeDataSource } from './repository/data-source';
export { getDataSource } from './repository/data-source';
import { assert } from 'console';
import { ProvideDependency } from './lib/di';
import bodyparser from 'body-parser';
import { HttpError } from 'http-errors';
import { warn } from './service';
import compression from 'compression';

const listen_callbacks = [];
ProvideDependency(null, {
    name: "listen-callback",
    object: listen_callbacks,
});

let listened: boolean = false;
export async function ExpressAppListen(port: number, host: string, backlog: number, callback: () => void)
{
    assert(!listened, "cann't initialize application twice");
    await initializeDataSource();

    const app = express();

    app.use(compression());
    app.use(bodyparser.json());
    app.use(bodyparser.urlencoded({ extended: false }));

    app.use('/', require('./routes').default);

    app.use((err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
        warn(err);

        if (err instanceof HttpError) {
            res.status(err.statusCode || 500).send(err.message);
        } else {
            res.status(500).send("internal server error");
        }
    });

    const server = app.listen(port, host, backlog, callback);
    listened = true;
    listen_callbacks.map(callback => callback(server));
    listen_callbacks.length = 0;
    return server;
}

