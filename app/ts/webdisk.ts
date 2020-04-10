/**
 * entry point
 */

import * as constants from './constants';
import * as detail from './details';
import * as global from './global_vars';
import * as register from './register';
import * as types from './types';
import * as util from './util';

let test_path: types.FileStat = {} as types.FileStat;
test_path.filename = "/usr/maybe.txt";
test_path.type     = types.FileType.reg;
let xx: string = types.FileType.block;

global.Details.UpdateDetails([new detail.DetailItem(test_path)]);

