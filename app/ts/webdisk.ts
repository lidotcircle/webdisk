/**
 * entry point
 */

import * as constants from './constants';
import * as detail from './details';
import { Detail, WS } from './global_vars';
import * as register from './register';
import * as types from './types';
import * as util from './util';
import * as websocket from './websocket';

let test_path: types.FileStat = {} as types.FileStat;
test_path.filename = "/usr/maybe.txt";
test_path.type     = types.FileType.reg;
let test_path2: types.FileStat = {} as types.FileStat;
test_path2.filename = "/usr/amaybe.txt";
test_path2.type     = types.FileType.reg;
Detail.Details.UpdateDetails([new detail.DetailItem(test_path), new detail.DetailItem(test_path2)]);
register.upload(Detail.Details.AttachElement);

websocket.SetupWS();

