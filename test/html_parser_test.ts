import * as parser from 'webdisk/lib/parse_html_inlinejs';

let pp = new parser.HTMLInlineJSParser('./hello.html');

pp.Parse((err) => {
    if(err) console.log(err.message);
    console.log("parse success 1");

    pp.newFile("./hello2.html");
    pp.Parse((err2) => {
        if(err2) console.log(err2.message);
        console.log("parse success 2");
    })
});

