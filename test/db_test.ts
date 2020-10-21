import * as db from 'webdisk/lib/database';


const u = new db.Database('/root/.webdisk/test.db');
u.init().then(() => {
    console.log("load db success");
}).catch(err => {
    console.log(err);
});

