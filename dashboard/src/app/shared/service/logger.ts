import { DexieWrapper } from './IndexDBDexieWrapper';

enum LoggerLevel {Debug = "debug", Info = "info", Warn = "warn", Error = "error"};

class LogMsg {
    who: string;
    level: LoggerLevel;
    date: number;
    message: string;
}

export class Logger {
    private mStorage: DexieWrapper;

    constructor() {
        this.mStorage = new DexieWrapper("logger");
        this.mStorage.createTable({kvstorage: "++id, who, level, date, message"});
    }
    private get table() {return this.mStorage.table("logger");}
    private async log(who: string, level: LoggerLevel, ...msg: any[]) {
        let put_msg = '';
        for(const n of msg) {
            put_msg += ' ';
            put_msg += JSON.stringify(n);
        }
        await this.table.put({who: who, level: level, date: Date.now(), message: put_msg});
    }

    public async get(who?: string, level?: LoggerLevel, dateMin?: number, dateMax?: number) {
        dateMin = dateMin || 1;
        dateMax = dateMax || Date.now();
        let ans = await this.table.where("date").between(dateMin, dateMax).toArray() as LogMsg[];
        if(!!who || !!level) {
            ans = ans.filter(v => (v.who == who || !who) && (v.level == level || !level));
        }
        return ans;
    }

    public debug(...args) {
        console.debug(...args);
        this.log('PROGRAM', LoggerLevel.Debug, ...args);
    }
    public info (...args) {
        console.info(...args);
        this.log('PROGRAM', LoggerLevel.Info,  ...args);
    }
    public warn (...args) {
        console.warn(...args);
        this.log('PROGRAM', LoggerLevel.Warn,  ...args);
    }
    public error(...args) {
        console.error(...args);
        this.log('PROGRAM', LoggerLevel.Error, ...args);
    }
}

