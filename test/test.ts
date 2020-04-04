import * as fs from 'fs';
import * as proc from 'process';

import * as util from '../src/util';

util.writeToWritable("../../tsconfig.json", 0, proc.stdout, -1, 1024, (err, nbytes) => {
    if(err) console.error("\n", err.message);
    console.log(`\nwrite ${nbytes}`);
});

