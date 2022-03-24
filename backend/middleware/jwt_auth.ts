import { RequestHandler, Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { DIProperty } from '../lib/di';
import { JWTService } from '../service';


const UserSymbol = Symbol('User');
const JWTDecodedSymbol = Symbol('JWTDecoded');
class JWTAuthMiddleware {
    @DIProperty(JWTService)
    private jwt_service: JWTService;

    constructor(private jwt_header: string) {}

    public middleware: RequestHandler = async (
        req: Request,
        _res: Response,
        next: NextFunction
    ) => {
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
