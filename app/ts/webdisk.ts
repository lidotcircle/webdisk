/**
 * entry point
 */

import * as constants from './constants';
import { Detail, WS, File } from './global_vars';
import * as register from './register';
import * as types from './types';
import * as util from './util';

import * as websocket from './websocket';
import * as detail from './details';
import * as fm from './file_manager';

// init
websocket.SetupWS();
fm.SetupFM();
detail.SetupDetail();

// test
let test_path: types.FileStat = {} as types.FileStat;
test_path.filename = "/usr/maybe.txt";
test_path.type     = types.FileType.reg;
let test_path2: types.FileStat = {} as types.FileStat;
test_path2.filename = "/usr/amaybe.txt";
test_path2.type     = types.FileType.reg;
register.upload(Detail.Details.AttachElement);

// ws
