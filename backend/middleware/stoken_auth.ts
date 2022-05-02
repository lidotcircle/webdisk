import { RequestHandler, Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { DIProperty } from '../lib/di';
import { UserTokenService } from '../service';
import { setAuthUsername, setAuthUser } from './userinfo';


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

        setAuthUser(req, user);
        setAuthUsername(req, user.username);
        next();
    }
}

export function createSTokenAuthMiddleware(usage: string) {
    const { middleware } =  new STokenAuthMiddleware(usage);
    return middleware;
}
