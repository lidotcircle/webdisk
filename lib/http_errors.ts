
export class HttpUnexpected extends Error {
    constructor(message?: string) {
        super(message);
    }
}

// Http Redirection 300- //{
export class HttpRedirection extends HttpUnexpected {
    protected _code: number = 300;
    get code(): number {return this._code;}
    protected _urls: string[] = [];
    get urls(): string[] {return this._urls;}

    constructor(urls: string[], message?: string) {
        super(message);
    }
}

function HttpRedirectionFactory(message: string, code: number) {
    return function<T extends {new (...args): HttpRedirection;}>(constructor: T) {
        return class extends constructor {
            constructor(...args){super(); this._code = code; this.message = message; this._urls = JSON.parse(JSON.stringify(args[0]));}
        }
    }
}

@HttpRedirectionFactory('Multiple Choice', 300)
export class MultipleChoice extends HttpRedirection {}

@HttpRedirectionFactory('Move Permanently', 301)
export class MovePermanently extends HttpRedirection {}

@HttpRedirectionFactory('Found', 302)
export class Found extends HttpRedirection {}

@HttpRedirectionFactory('See Other', 303)
export class SeeOther extends HttpRedirection {}

@HttpRedirectionFactory('Not Modified', 304)
export class NotModified extends HttpRedirection {}

@HttpRedirectionFactory('Temporary Redirect', 307)
export class TemporaryRedirect extends HttpRedirection {}

@HttpRedirectionFactory('Permanently Redirect', 308)
export class PermanentlyRedirect extends HttpRedirection {}
//}


// Http Client Error 400- //{
export class HttpClientError extends HttpUnexpected {
    protected _code: number = 400;
    get code(): number {return this._code;}

    constructor(message?: string) {
        super(message);
    }
}

function HttpClientErrorFactory(message: string, code: number) {
    return function<T extends {new (...args): HttpClientError;}>(constructor: T) {
        return class extends constructor {
            constructor(...args){super(); this._code = code; this.message = message;}
        }
    }
}

@HttpClientErrorFactory('Bad Request', 400)
export class BadRequest extends HttpClientError {}

@HttpClientErrorFactory('Unauthorized', 401)
export class Unauthorized extends HttpClientError {}

@HttpClientErrorFactory('Forbidden', 403)
export class Forbidden extends HttpClientError {}

@HttpClientErrorFactory('Not Found', 404)
export class NotFound extends HttpClientError {}

@HttpClientErrorFactory('Method Not Allowed', 405)
export class MethodNotAllowed extends HttpClientError {}

@HttpClientErrorFactory('Not Acceptable', 406)
export class NotAcceptable extends HttpClientError {}

@HttpClientErrorFactory('Payload Too Large', 413)
export class PayloadTooLarge extends HttpClientError {}

@HttpClientErrorFactory('URI Too Large', 414)
export class URITooLarge extends HttpClientError {}
//} End of Http Client Error


// Http Server Error 500- //{
export class HttpServerError extends HttpUnexpected {
    protected _code: number = 500;
    get code(): number {return this._code;}

    constructor(message?: string) {
        super(message);
    }
}

function HttpServerErrorFactory(message: string, code: number) {
    return function<T extends {new (...args): HttpServerError;}>(constructor: T) {
        return class extends constructor {
            constructor(...args){super(); this._code = code; this.message = message;}
        }
    }
}


@HttpServerErrorFactory('Internal Server Error', 500)
export class InternalServerError extends HttpServerError {}

@HttpServerErrorFactory('Not Implemented', 501)
export class NotImplemented extends HttpServerError {}
//}

