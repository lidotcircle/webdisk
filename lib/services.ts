import { conf } from './config';
import * as db from './database';


export const DB: db.Database = new db.Database(conf.sqlite3Database);

