import * as parser from 'webdisk/lib/parse_html_inlinejs';
import * as path   from 'path';
import * as proc   from 'process';

function test_parse() {
    let pp = new parser.HTMLInlineJSParser('./hello.html');

    pp.Parse((err) => {
        if(err) console.log(err.message);
        console.log("parse success 1");

        pp.newFile("./hello.html");
        pp.Parse((err2) => {
            if(err2) console.log(err2.message);
            console.log("parse success 2");
        })
    });
}

function test_cproc() {
    parser.parseHTMLNewProc(path.resolve("./hello.html"), "hello", proc.stdout, proc.stderr);
}

test_cproc();
