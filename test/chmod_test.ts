import * as util from '../release/webdisk/lib/util';
import * as utilx from 'util';

let pp = utilx.promisify(util.chmod_files);

async function xx() {
    let x = await pp("./cccc", "777", 2, /.*/);
    console.log(`something, ${x}`); 
}

xx().then(() => {
    console.log("yes");
}, (err) => {
    console.log(err);
});

