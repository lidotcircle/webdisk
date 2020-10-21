import * as winston from 'winston';
import * as proc from 'process';
import * as path from 'path';

const logger = winston.createLogger({
    level: "debug",
    format: winston.format.json(),
    defaultMeta: {application: "webdisk", pid: proc.pid},
    transports: [
        new winston.transports.File({filename: path.join("webdisk.log")}),
        new winston.transports.Console()
    ]
});

export function debug(...msg)
{
    logger.debug(msg);
}

export function info(...msg)
{
    logger.info(msg);
}

export function warn(...msg)
{
    logger.warn(msg);
}

export function error(...msg)
{
    logger.error(msg);
}

