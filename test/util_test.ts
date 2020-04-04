import * as fs from 'fs';
import * as proc from 'process';

import * as util from 'webdisk/lib/util';

util.writeToWritable("./server.json", 0, proc.stdout, -1, 1024, false, (err, nbytes) => {
    if(err) console.error("\n", err.message);
    console.log(`\nwrite ${nbytes}`);
});

