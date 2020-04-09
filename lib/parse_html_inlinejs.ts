/* execute inline javascript in html surround by <% /js code/ %>*/

/* write html to writable stream, default is stdout */

import * as stream  from 'stream';
import * as fs      from 'fs';
import * as sbuffer from 'smart-buffer';
import * as path    from 'path';
import * as decoder from 'string_decoder';

import * as child_process from 'child_process';

import * as timers from 'timers';

import proc from 'process';

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
    let absPath: string;
    if(path.isAbsolute(htmlPath))
        absPath = htmlPath;
    else
        absPath = path.resolve(PrecedeHTMLPath[PrecedeHTMLPath.length - 1], htmlPath);
    let parser = new HTMLInlineJSParser(absPath, HTMLWriter, jsenv);
    parser.ParseSync();
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
export class HTMLInlineJSParser //{
{
    private htmlPath: string;
    private writer: stream.Writable;
    private parserState: ParseState;
    private jsbuffer: sbuffer.SmartBuffer;
    private JsEnv: any;

    constructor (htmlPath: string, writer: stream.Writable = proc.stdout, jsenv: any = null) {
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
        HTMLWriter = this.writer;
        PrecedeHTMLPath.push(path.dirname(this.htmlPath));
        let JSENV = this.JsEnv;
        let MSG = JSENV && JSENV["MSG"];
        let REQ = MSG && MSG["REQ"];
        let CONFIG = MSG && MSG["CONFIG"];
        let save_cwd = proc.cwd();
        proc.chdir(path.dirname(this.htmlPath));
        try {
            eval(this.jsbuffer.toString());
        } catch (err) {
            errcallback(err);
        } finally {
            PrecedeHTMLPath.pop();
            this.jsbuffer = new sbuffer.SmartBuffer();
            proc.chdir(save_cwd);
        }
        return this.writer.write("");
    }

    private write_to_writer(buf: string, cb: (err) => void): boolean {
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
    let cproc: child_process.ChildProcess;
    cproc = child_process.spawn("node", [__filename, htmlPath], {stdio: ["ipc", "pipe", "pipe"]});
    /*
    if (errstream == null) {
        cproc = child_process.spawn("node", [__filename, htmlPath], {stdio: ["ipc", outstream, "pipe"]});
        cproc.stderr.on("readable", () => {
            let buf = cproc.stderr.read();
            if (buf != null)
                cproc.emit("error", new Error("\n----------------------------------\nstderr output:" + buf.toString('utf8') + 
                                              "----------------------------------"));
        });
    } else {
        cproc = child_process.spawn("node", [__filename, htmlPath], {stdio: ["ipc", outstream, errstream]});
    }
    */
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
        if (cproc != null && !cproc.killed) cproc.kill("SIGABRT");
        if (cb == null && err != null) throw err;
        cb(err);
    };
    cproc.on("error", safe_callback);
    cproc.send(msg, (err) => {
        if (err) throw err;
    });
    return;
}

function main() {
    if (proc.argv.length != 3) throw new Error("bad command line arguments");
    let check = timers.setTimeout(() => {
        throw new Error("wait message timeout");
    }, 100);
    proc.once("message", (msg) => {
        timers.clearTimeout(check);
        let parser = new HTMLInlineJSParser(proc.argv[2], proc.stdout, {MSG: msg});
        parser.Parse((err) => {
            if (err) throw err;
        });
    });
}

if (require.main === module) 
    main();

