import * as db from './database';
import { conf } from './config';


export const DB: db.Database = new db.Database(conf.sqlite3Database);

