import * as config from 'webdisk/lib/server_config';

let pp = new config.ServerConfig("./server.json");

pp.ParseFile((err) => {
    if (err) throw err;
    console.log(JSON.stringify(pp.GetProfile("webdisk"), null, 1));
    pp.newUser("hello");
    console.log(JSON.stringify(pp.GetProfile("hello"), null, 1));
    pp.WriteBack((err) => {
        if (err != null) throw err;
        console.log("success");
    });
});
