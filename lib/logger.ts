import * as winston from 'winston';
import * as proc from 'process';
import * as path from 'path';

export const logger = winston.createLogger({
    level: "debug",
    format: winston.format.json(),
    defaultMeta: {application: "webdisk", pid: proc.pid},
    transports: [
        new winston.transports.File({filename: path.join("webdisk.log")}),
        new winston.transports.Console()
    ]
});


