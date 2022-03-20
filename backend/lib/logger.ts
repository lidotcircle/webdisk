import * as winston from 'winston';
import * as proc from 'process';
import * as path from 'path';
import { DIProperty, Injectable, ProvideDependency, QueryDependency } from './di';
import { Config } from './config';


export class Logger {
    debug(...msg: any[]) {}
    info (...msg: any[]) {}
    warn (...msg: any[]) {}
    error(...msg: any[]) {}
    close(...msg: any[]) {}
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
});

export function debug(...msg) {QueryDependency(Logger).debug(msg);}
export function info (...msg) {QueryDependency(Logger).info (msg);}
export function warn(...msg)  {QueryDependency(Logger).warn (msg);}
export function error(...msg) {QueryDependency(Logger).error(msg);}
export function CloseLogger() {QueryDependency(Logger).close();}

