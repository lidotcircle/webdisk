import * as http from 'http';
import * as util from 'webdisk/lib/util';
import * as fs   from 'fs';
import * as stream from 'stream';
import * as proc   from 'process';
import * as net    from 'net';
import * as event  from 'events';

import * as annautils from 'annautils';

let server = http.createServer();

function writeToStream(fd: number, writer: stream.Writable, bufsize: number, cb: (err) => void) {
    if (bufsize < 0 || fd < 0)
        return cb(new Error("Argument Error"));
    let buf = new Buffer(bufsize);
    let writed = 0;
    let func = () => {
//        console.log(writed);
        let bfs = bufsize;
        fs.read(fd, buf, 0, bfs, writed, (err, n, b) => {
            if(err)
                return cb(err);
            writed += n;
            if (n != bufsize) { // last chunk
                if (n == 0) return cb(null);
                let bb = new Buffer(n);
                buf.copy(bb, 0, 0, n - 1);
                writer.write(bb);
                proc.stdout.write(bb);
                return cb(null);
            }
            writer.write(buf);
            proc.stdout.write(buf);
            proc.nextTick(func); // why ?????
        });
    }
    func();
}

server.on("upgrade", (req, socket, head) => {
});

server.on("request", (req, res: http.ServerResponse) => {
    fs.stat("./hello.html", (err, stat) => {
        if (err) {
            res.writeHead(404);
            return res.end();
        }
        res.setHeader("Content-Type", "text/html");
        res.setHeader("Content-Length", stat.size);
        /*
        res.setHeader("Content-Length", 154);
        res.writeHead(200);
        res.write("<h3>AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA</h3>\n");
        res.write("<h3>BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB</h3>\n");
        res.write("<h3>CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC</h3>\n");
        res.write("<h3>DDDDDDDDDDDDDDDD</h3>");
        res.end();
        */
        annautils.stream.pathWriteToWritable("./hello.html", 0, res, -1, 210, false, (err, n) => {
            console.log("write " + n);
            return res.end();
        });
        /*
        fs.open("./hello.html", "r", (err, fd) => {
            if(err) return res.writeHead(500);
            writeToStream(fd, res, 100, (err) => {
                if(err) return res.writeHead(500);
                res.end();
            });
        });
        */
    });
});

server.listen(7777, "0.0.0.0");

server.on("listening", () => {
    console.log("listening at 0.0.0.0:7777");
});

