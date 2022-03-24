import * as winston from 'winston';
import * as proc from 'process';
import { ProvideDependency, QueryDependency } from '../lib/di';
import { Config } from './config-service';


export class Logger {
    debug(..._: any[]) {}
    info (..._: any[]) {}
    warn (..._: any[]) {}
    error(..._: any[]) {}
    close(..._: any[]) {}
}

class WLogger extends Logger {
    private logger: winston.Logger;
    private alive: boolean = true;

    constructor(private config: Config) {
        super();
        const transports = [];
        if(this.config.logger?.console) {
            transports.push(new winston.transports.Console());
        }
        if(this.config.logger?.file) {
            transports.push(new winston.transports.File({filename: this.config.logger.file}));
        }
        if(transports.length == 0) {
            this.alive = true;
            return;
        }

        this.logger = winston.createLogger({
            level: this.config.logger?.level || "debug",
            format: winston.format.cli(),
            defaultMeta: {application: "webdisk", pid: proc.pid},
            transports: transports,
        });
    }

    debug(...msg: any[]) {if(this.alive) this.logger.debug(msg)}
    info (...msg: any[]) {if(this.alive) this.logger.info(msg)}
    warn (...msg: any[]) {if(this.alive) this.logger.warn(msg)}
    error(...msg: any[]) {if(this.alive) this.logger.error(msg)}
    close() {this.alive = false; this.logger.close();}
}

ProvideDependency(Logger, {
    name: 'logger',
    factory: (config: Config) => new WLogger(config),
    paramtypes: [Config],
    lazy: true,
});

export function debug(...msg: any[]) {QueryDependency(Logger).debug(msg);}
export function info (...msg: any[]) {QueryDependency(Logger).info (msg);}
export function warn (...msg: any[]) {QueryDependency(Logger).warn (msg);}
export function error(...msg: any[]) {QueryDependency(Logger).error(msg);}
export function CloseLogger() {QueryDependency(Logger).close();}

