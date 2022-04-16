import { RequestHandler, Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { DIProperty } from '../lib/di';
import { UserService } from '../service';
import { setAuthUsername, setAuthUser } from './userinfo';


const UserSymbol = Symbol('user');
const UsernameSymbol = Symbol('username');
class PasswordAuthMiddleware {
    @DIProperty(UserService)
    private userService: UserService;

    constructor(private username_field: string, private password_field: string) {}

    public middleware: RequestHandler = async (
        req: Request,
        _res: Response,
        next: NextFunction
    ) => {
        if (!req.body) {
            return next(new createHttpError.BadRequest('No body'));
        }

        const username = req.body[this.username_field] || req.headers['x-' + this.username_field];
        const password = req.body[this.password_field] || req.headers['x-' + this.password_field];
        if (!username || !password) {
            return next(new createHttpError.Unauthorized('bad username or password' ));
        }
        if (!this.userService.verifyUsernamePassword(username, password)) {
            return next(new createHttpError.Unauthorized('failed to authenticate' ));
        }
        const user = await this.userService.getUser(username);
        if (!user) {
            return next(new createHttpError.InternalServerError("unexpected error"));
        }
        req[UserSymbol] = user;
        req[UsernameSymbol] = username;
        setAuthUser(req, user);
        setAuthUsername(req, username);
        next();
    }
}

export function createPasswordAuthMiddleware(username_field: string, password_field: string) {
    const { middleware } =  new PasswordAuthMiddleware(username_field, password_field);
    return middleware;
}

export function getPasswordAuthUser(req: Request) {
    return req[UserSymbol];
}

export function getPasswordAuthUsername(req: Request) {
    return req[UsernameSymbol];
}
