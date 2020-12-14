import * as dexie from 'dexie';
import { Dexie } from 'dexie';
import { ForwardGetterProperty, ForwardMethod, TypeOfClassMethod, TypeOfClassProperty } from '../utils';


export class DexieWrapper {
    private db: dexie.Dexie;

    constructor(dbname: string) {
        this.db = new dexie.Dexie(dbname);
        window["db"] = this;
    }

    private get version() {return this.db.version(1);}

    @ForwardMethod("version", "stores")
    createTable: TypeOfClassMethod<dexie.Version, "stores">;

    @ForwardMethod("db", "transaction")
    transaction: TypeOfClassMethod<Dexie, "transaction">;
    @ForwardMethod("db", "table")
    table: TypeOfClassMethod<Dexie, "table">;
    @ForwardMethod("db", "on")
    on: TypeOfClassMethod<Dexie, "on">;
    @ForwardMethod("db", "delete")
    delete: TypeOfClassMethod<Dexie, "delete">;

    @ForwardGetterProperty("db", "tables")
    tables: TypeOfClassProperty<Dexie, "tables">;
}

