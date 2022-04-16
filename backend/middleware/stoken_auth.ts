import { RequestHandler, Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { DIProperty } from '../lib/di';
import { UserTokenService } from '../service';


const UsernameSymbol = Symbol('username');
const UserSymbol = Symbol('user');
class STokenAuthMiddleware {
    @DIProperty(UserTokenService)
    private userTokenService: UserTokenService;

    constructor(private usage: string) {}

    public middleware: RequestHandler = async (
        req: Request,
        _res: Response,
        next: NextFunction
    ) => {
        const stoken = req.query['stoken'] || req.headers['x-stoken'] || req.body['stoken'];
        if (!stoken) {
            return next(new createHttpError.BadRequest('no stoken'));
        }

        const user = await this.userTokenService.validate(stoken, this.usage);
        if (!user)
            return next(new createHttpError.BadRequest());

        req[UsernameSymbol] = user.username;
        req[UserSymbol] = user;
        next();
    }
}

export function createSTokenAuthMiddleware(usage: string) {
    const { middleware } =  new STokenAuthMiddleware(usage);
    return middleware;
}

export function getSTokenAuthUser(req: Request) {
    return req[UserSymbol];
}

export function getSTokenAuthUsername(req: Request) {
    return req[UsernameSymbol];
}
