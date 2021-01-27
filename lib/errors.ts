
export class HttpError extends Error {
    protected _code: number = 500;
    get code(): number {return this.code;}

    constructor(message?: string) {
        super(message);
    }
}

function HttpErrorFactory(message: string, code: number) {
    return function<T extends {new (...args): HttpError;}>(constructor: T) {
        return class extends constructor {
            constructor(...args){super(); this._code = code; this.message = message;}
        }
    }
}

@HttpErrorFactory('Bad Request', 400)
export class BadRequest extends HttpError {}

@HttpErrorFactory('Unauthorized', 401)
export class Unauthorized extends HttpError {}

@HttpErrorFactory('Forbidden', 403)
export class Forbidden extends HttpError {}

@HttpErrorFactory('Not Found', 404)
export class NotFound extends HttpError {}

@HttpErrorFactory('Method Not Allowed', 405)
export class MethodNotAllowed extends HttpError {}

@HttpErrorFactory('Not Acceptable', 406)
export class NotAcceptable extends HttpError {}

@HttpErrorFactory('Payload Too Large', 413)
export class PayloadTooLarge extends HttpError {}

@HttpErrorFactory('URI Too Large', 414)
export class URITooLarge extends HttpError {}

@HttpErrorFactory('Internal Server Error', 500)
export class InternalServerError extends HttpError {}

@HttpErrorFactory('Not Implemented', 501)
export class NotImplemented extends HttpError {}

