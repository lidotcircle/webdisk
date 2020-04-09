import * as http from 'http';
import * as stream from 'stream';
import * as webdisk from 'webdisk';

export let REQ: http.IncomingMessage;
export let MSG: any;
export let JSENV: any;
export let HTMLWriter: stream.Writable;
export let CONFIG: webdisk.config;
export let include: typeof webdisk.include = webdisk.include;

function __login__() {
    let user = CONFIG.LookupUserRootBySID(REQ.headers["cookie"]);
    if (user == null)
        include("./template/login_page.html");
    else
        include("./template/user_page.html", user);
}
