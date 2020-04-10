import * as http from 'http';
import * as proc from 'process';
import * as path from 'path';
import * as stream from 'stream';
import * as webdisk from 'webdisk';


export type Message = {
    REQ: http.IncomingMessage;
    MSG: any;
    JSENV: any;
    HTMLWriter: stream.Writable;
    CONFIG: webdisk.UserProfile[];
};
export const include: typeof webdisk.include = webdisk.include;

import * as winston from 'winston';

const logger = winston.createLogger({
    level: "debug",
    format: winston.format.label(),
    defaultMeta: {application: "webdisk"},
    transports: [
        new winston.transports.File({filename: path.join(proc.cwd(), "webdisk.log")})
    ]
});

export function debug(msg) {
    logger.debug(msg);
}

export function __login__(msg: Message) {
    let user = null;
    let users = msg.CONFIG || [];
    if (msg.REQ && msg.REQ.headers) {
        let cookie = msg.REQ.headers["Cookie"] || msg.REQ.headers["cookie"];
        let parsed_cookie = webdisk.parseCookie(cookie as string);
        let sid = parsed_cookie.get("SID");
        if (sid) {
            for (let v of users) {
                if (v.SID == sid) {
                    user = v;
                    break;
                }
            }
        }
    }
    if (user == null)
        include("./template/login_page.html");
    else
        include("./template/user_page.html", user);
}
