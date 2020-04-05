import * as utilx from 'webdisk/lib/util';
import * as proc from 'process';

utilx.writeToWritable("/home/prack/webdisk.tar.gz", 0, proc.stdout, -1, 1024, false, (err, nbyte) => {
    if (err) throw err;
});
