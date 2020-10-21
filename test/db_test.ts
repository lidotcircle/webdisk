import * as db from 'webdisk/lib/database';
import * as proc from 'process';

const dbpath = proc.env.HOME + '/.webdisk/test.db';

const u = new db.Database(dbpath);
u.init().then(() => {
    console.log("load db success");
}).catch(err => {
    console.log(err);
});

