import * as winston from 'winston';
import * as proc from 'process';
import * as path from 'path';

const logger = winston.createLogger({
    level: "debug",
    format: winston.format.cli(),
    defaultMeta: {application: "webdisk", pid: proc.pid},
    transports: [
        new winston.transports.File({filename: path.join("webdisk.log")}),
        new winston.transports.Console()
    ]
});
let loggeralive: boolean = true;

export function DisableConsoleLogger() {
    if(!loggeralive) return;
    logger.configure({
        transports: [
            new winston.transports.File({filename: path.join("webdisk.log")}),
        ]
    });
}
export function CloseLogger() {
    if(!loggeralive) return;
    loggeralive = false;
    logger.close();
}

export function debug(...msg)
{
    if(!loggeralive) return;
    logger.debug(msg);
}

export function info(...msg)
{
    if(!loggeralive) return;
    logger.info(msg);
}

export function warn(...msg)
{
    if(!loggeralive) return;
    logger.warn(msg);
}

export function error(...msg)
{
    if(!loggeralive) return;
    logger.error(msg);
}

