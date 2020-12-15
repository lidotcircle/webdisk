import { ForwardMethod, TypeOfClassMethod } from '../utils';
import { Injectable } from '@angular/core';
import { Logger } from './logger';

@Injectable({
    providedIn: 'root'
})
export class LoggerService {
    logger: Logger;
    constructor() {
        this.logger = new Logger();
    }

    @ForwardMethod("logger", "debug")
    debug: TypeOfClassMethod<Logger, "debug">;
    @ForwardMethod("logger", "info")
    info:  TypeOfClassMethod<Logger, "info">;
    @ForwardMethod("logger", "warn")
    warn: TypeOfClassMethod<Logger, "warn">;
    @ForwardMethod("logger", "error")
    error: TypeOfClassMethod<Logger, "error">;
    @ForwardMethod("logger", "get")
    get: TypeOfClassMethod<Logger, "get">;
}

