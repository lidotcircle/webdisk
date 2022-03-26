import { RequestHandler, Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { DIProperty } from '../lib/di';
import { JWTService } from '../service';
import { getPasswordAuthUsername, createPasswordAuthMiddleware } from './password_auth';


const password_debug_middleware = createPasswordAuthMiddleware("username", "password");
const UserSymbol = Symbol('User');
const JWTDecodedSymbol = Symbol('JWTDecoded');
class JWTAuthMiddleware {
    @DIProperty(JWTService)
    private jwt_service: JWTService;
    private __testing: boolean;

    constructor(private jwt_header: string)
    {
        this.__testing = true;
    }

    public middleware: RequestHandler = async (
        req: Request,
        _res: Response,
        next: NextFunction
    ) => {
        if (this.__testing) {
            let error: any;
            const fake_next = (err: any) => error = err;
            try {
                await (password_debug_middleware(req, _res, fake_next) as any as Promise<void>);
            } catch (e) {
                error = e;
            }
            const username = getPasswordAuthUsername(req);
            if (!error && username) {
                req[UserSymbol] = username;
                return next();
            }
        }

        const token = req.headers[this.jwt_header] as string;
        if (!token) {
            return next(new createHttpError.Unauthorized("No token provided"));
        }
        if (!this.jwt_service.verify(token)) {
            return next(new createHttpError.Unauthorized("Invalid token"));
        }
        const dtoken = this.jwt_service.decode(token);
        req[UserSymbol] = dtoken.username;
        req[JWTDecodedSymbol] = dtoken;
        next();
    }
}

export function createJWTAuthMiddleware(jwt_header: string) {
    const { middleware } =  new JWTAuthMiddleware(jwt_header);
    return middleware;
}

export const defaultJWTAuthMiddleware = createJWTAuthMiddleware('x-access-token');

export function getJWTAuthUser(req: Request) {
    return req[UserSymbol];
}

export function getJWTAuthDecoded(req: Request) {
    return req[JWTDecodedSymbol];
}
