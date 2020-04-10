/* execute inline javascript in html surround by <% /js code/ %>*/

/* write html to writable stream, default is stdout */

import * as stream  from 'stream';
import * as fs      from 'fs';
import * as sbuffer from 'smart-buffer';
import * as path    from 'path';
import * as decoder from 'string_decoder';

import * as config from './server_config';

import * as child_process from 'child_process';

import * as timers from 'timers';

import proc from 'process';
import * as annautils from 'annautils';

function debug(msg)
{
//    console.log(msg);
}

let xrequire = require;

/*                  ***       <      %     %        > ***   */
enum ParseState {/* HTML, */LArrow, JS, RPercent, HTML};
/*
 * if   (returnParseState == Common) html code 
 * else can be treated as JS code
 */

/*
 * HTML variables
 * HTMLWriter: stream.Writable;
 * JSENV: any;
 *  |-  MSG: any;
 *       |-  REQ: any;
 *       |-  CONFIG: config;
 */

export function include(htmlPath: string, jsenv: any = null) //{
{
    debug(`call include(${htmlPath}, jsenv)`);
    let absPath: string;
    if(path.isAbsolute(htmlPath))
        absPath = htmlPath;
    else
        absPath = path.resolve(lastDir(), htmlPath);
    let parser = new HTMLInlineJSParser(absPath, HTMLWriter, jsenv);
    parser.ParseSync();
} //}

function fwriteToWritableSync(fd: number, startPosition: number, writer: stream.Writable, 
                    length: number = -1, chunksize: number = 1024, callend: boolean = true): number //{
{
    if (chunksize <= 0 || (length != -1 && length < 0)) {
        throw new Error("argument error");
    }
    let buf = Buffer.alloc(chunksize);
    let writed: number = 0;
    while(writed < length || length == -1) {
        let chunks;
        if (writed + chunks >= length || length == -1)
            chunks = chunksize;
        else
            chunks = length - writed;
        let nn = fs.readSync(fd, buf, 0, chunks, writed + startPosition);
        writed += nn;
        if (nn == chunksize) {
            writer.write(buf);
        } else { // last chunk
            if (nn != 0) {
                let nbuf = Buffer.alloc(nn);
                buf.copy(nbuf, 0, 0, nn);
                writer.write(nbuf);
            }
            if (callend) writer.end();
            break;
        }
    }
    return writed;
} //}
function writeToWritableSync(path: string, startPosition: number, writer: stream.Writable, length: number = -1,
                         chunksize: number = 1024, callend: boolean = true): number //{
{
    let fd = fs.openSync(path, "r");
    return fwriteToWritableSync(fd, startPosition, writer, length, chunksize, callend);
} //}

export function include_plain(docpath: string) //{
{
    debug(`call include_plain(${docpath})`);
    let absPath: string;
    if(path.isAbsolute(docpath))
        absPath = docpath;
    else
        absPath = path.resolve(lastDir(), docpath);
    writeToWritableSync(absPath, 0, HTMLWriter, -1, 1024, false);
} //}

function StateTransition(state: ParseState, char: string): [ParseState, string] //{
{
    if (char.length != 1) throw new Error("argument error");
    switch (state) {
        case ParseState.HTML:
            switch (char) {
                case "<":
                    return [ParseState.LArrow, ""];
                default:
                    return [ParseState.HTML, char];
            }
        case ParseState.LArrow:
            switch (char) {
                case "%":
                    return [ParseState.JS, ""];
                default:
                    return [ParseState.HTML, "<" + char];
            }
        case ParseState.JS:
            switch (char) {
                case "%":
                    return [ParseState.RPercent, ""];
                default:
                    return [ParseState.JS, char];
            }
        case ParseState.RPercent:
            switch (char) {
                case ">":
                    return [ParseState.HTML, ""];
                default:
                    return [ParseState.JS, "%" + char];
            }
    }
} //}

let HTMLWriter: stream.Writable; // use this in inline JS
let PrecedeHTMLPath: string[] = [];
function lastDir() {
    return PrecedeHTMLPath.length > 0 ? PrecedeHTMLPath[PrecedeHTMLPath.length - 1] : null;
}

export class HTMLInlineJSParser //{
{
    private htmlPath: string;
    private writer: stream.Writable;
    private parserState: ParseState;
    private jsbuffer: sbuffer.SmartBuffer;
    private JsEnv: any;

    constructor (htmlPath: string, writer: stream.Writable = proc.stdout, jsenv: any = null) {
        debug("call new HTMLInlineJSParser(...)");
        this.htmlPath = path.resolve(htmlPath);
        this.writer = writer;
        this.parserState = ParseState.HTML;
        this.jsbuffer = null;
        this.JsEnv = jsenv;
    }

    public newFile(htmlPath: string): void {
        this.htmlPath = path.resolve(htmlPath);
        this.parserState = ParseState.HTML;
    }

    private eval_js(errcallback: (err) => void): boolean {
        debug(`call eval_js()`);
        PrecedeHTMLPath.push(path.dirname(this.htmlPath));
        let require = (modulex: string) => {
            let error;
            try {
                return xrequire(modulex)
            } catch (err) {
                error = err;
            }
            try {
                return xrequire(path.join(lastDir(), modulex));
            } catch (err_) {
                throw err_;
            }
        }
        HTMLWriter = this.writer;
        let JSENV = this.JsEnv;
        let MSG = JSENV && JSENV["MSG"];
        let REQ = MSG && MSG["REQ"];
        let CONFIG = MSG && MSG["CONFIG"];
        try {
            eval(this.jsbuffer.toString());
        } catch (err) {
            this.writer.write("<code style='dispaly: block; white-space: pre-wrap;'>" + JSON.stringify({
                JSENV: JSENV,
                MSG: MSG,
                REQ: REQ,
                CONFIG: CONFIG,
                DIR_STACK: PrecedeHTMLPath,
                CWD: proc.cwd()
            }, null, 1) + "</code>");
            this.writer.write(`<h1>${err.toString()}</h1>`);
            errcallback(err);
        } finally {
            PrecedeHTMLPath.pop();
            this.jsbuffer = new sbuffer.SmartBuffer();
        }
        return this.writer.write("");
    }

    private write_to_writer(buf: string, cb: (err) => void): boolean {
        debug(`call write_to_writer(${buf})`);
        let writer_buffer_not_full: boolean = true;
        let len = buf.length;
        for (let i = 0; i<len; i++) {
            let c = buf.charAt(i);
            let o: string;
            let f: boolean = this.parserState == ParseState.RPercent;
            [this.parserState, o] = StateTransition(this.parserState, c);
            if (f && this.parserState == ParseState.HTML) {
                writer_buffer_not_full = this.eval_js(cb) && writer_buffer_not_full;
                continue;
            }
            if (this.parserState == ParseState.HTML) {
                writer_buffer_not_full = this.writer.write(o) && writer_buffer_not_full;
            } else if (o.length != 0) {
                this.jsbuffer.insertString(o, this.jsbuffer.length, "utf8");
            }
        }
        return writer_buffer_not_full;
    }

    public Parse(cb_: (err) => void = null): void {
        debug(`call HTMLInlineJSParser.Parse()`);
        this.jsbuffer = new sbuffer.SmartBuffer();
        let writer_not_full: boolean = true;
        let cb = (err) => {
            if(cb_ == null) {
                if(err == null) {
                    if(this.parserState != ParseState.HTML)
                        throw new Error("unclosed javascript");
                    return;
                }
                throw err;
            }
            if (err == null && this.parserState != ParseState.HTML)
                return cb_(new Error("unclosed javascript"));
            cb_(err);
        }
        fs.open(this.htmlPath, "r", (err, fd) => {
            if (err) cb(err);
            let instream: fs.ReadStream = fs.createReadStream("", {
                fd: fd,
                encoding: "utf8"
            });

            let ondrain = () => {
                writer_not_full = true;
                instream.emit("readable");
            };
            this.writer.on("drain", ondrain);

            let onerror = () => {
                instream.emit("error");
            }
            this.writer.on("error", onerror);

            let callback_m = (err) => {
                instream.close();
                this.writer.removeListener("drain", ondrain);
                this.writer.removeListener("error", onerror);
                return cb(err);
            }
            let already_error = false;
            instream.on("error", callback_m);
            instream.on("end", () => {
                if (already_error) return;
                callback_m(null);
            });
            instream.on("readable", () => {
                let buf: string;
                while(null != (buf = instream.read())) {
                    if (writer_not_full == false) return;
                    writer_not_full = this.write_to_writer(buf, err => {
                        already_error = true;
                        instream.emit("error", err);
                    });
                }
            });
        });
    }

    public ParseSync() {
        debug(`call HTMLInlineJSParser.ParseSync()`);
        let buf_decoder = new decoder.StringDecoder("utf8");
        let fd = fs.openSync(this.htmlPath, "r");
        this.jsbuffer = new sbuffer.SmartBuffer();
        let bufsize = 1024;
        let buf = new Buffer(bufsize);
        let readsize: number;
        let readed: number = 0;
        while((readsize = fs.readSync(fd, buf, 0, bufsize, readed)) > 0) {
            readed += readsize;
            let buf_ff: Buffer;
            if (readsize == bufsize)
                buf_ff = buf;
            else {
                buf_ff = new Buffer(readsize);
                if (buf.copy(buf_ff, 0, 0, readsize) != readsize) throw new Error("I don't know why this happen");
            }
            let str = buf_decoder.write(buf_ff);
            this.write_to_writer(str, (err) => {
                if (err) throw err;
            });
        }
        if (this.parserState != ParseState.HTML)
            throw new Error("unclosed javascript");
    }
} //}

export function parseHTMLNewProc(htmlPath: string, msg: any, outstream: stream.Writable, 
    errstream: stream.Writable = null, cb: (err) => void = null)
{
    debug(`call parseHTMLNewProc(${htmlPath}, msg, outstream, errstream, cb)`);
    let cproc: child_process.ChildProcess;
    cproc = child_process.spawn("node", [__filename, htmlPath], {stdio: ["ipc", "pipe", "pipe"]});
    if (errstream == null) {
        cproc.stderr.on("readable", () => {
            let buf = cproc.stderr.read();
            if (buf != null)
                cproc.emit("error", new Error("\n----------------------------------\nstderr output:" + buf.toString('utf8') + 
                    "----------------------------------"));
        });
    } else {
        cproc.stderr.pipe(errstream);
    }
    cproc.stdout.pipe(outstream);

    let safe_callback = (err) => {
        debug(`${module.filename}#parseHTMLNewProc(): ${err.toString()}`);
        if (cproc != null && !cproc.killed) cproc.kill("SIGABRT");
        if (cb == null && err != null) throw err;
        cb(err);
    };
    cproc.on("error", safe_callback);
    cproc.send(msg, (err) => {
        debug(`${module.filename}#parseHTMLNewProc(): send message`);
        if (err) throw err;
    });
    return;
}

function main() {
    debug("call html inline js parser main()");
    if (proc.argv.length != 3) throw new Error("bad command line arguments");
    let check = timers.setTimeout(() => {
        debug(`${module.filename}#main(): message timeout`);
        throw new Error("wait message timeout");
    }, 100);
    proc.once("message", (msg) => {
        debug(`${module.filename}#main(): recieve message`);
        timers.clearTimeout(check);
        let parser = new HTMLInlineJSParser(proc.argv[2], proc.stdout, {MSG: msg});
        parser.Parse((err) => {
            if (err) throw err;
        });
    });
}

if (require.main === module) 
    main();

