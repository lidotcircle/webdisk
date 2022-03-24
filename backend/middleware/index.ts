export * from './websocket';
export * from './jwt_auth';
export * from './websocket';
export * from './password_auth';
import { Request, Response, NextFunction } from 'express';


type MiddlewareType = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

export function AnyOfNoError(...middlewares: MiddlewareType[]): MiddlewareType
{
    return async (req: Request, res: Response, next: NextFunction) => {
        let error = null;
        const fake_next = (err: any) => { error = err; };

        for (const middleware of middlewares) {
            try {
                await middleware(req, res, fake_next);
                if (!error) {
                    return next();
                }
            } catch (e) {
                continue;
            }
        }
        next(error);
    };
}

export function AllOfNoError(...middlewares: MiddlewareType[]): MiddlewareType
{
    return async (req: Request, res: Response, next: NextFunction) => {
        let error = null;
        const fake_next = (err: any) => { error = err; };

        for (const middleware of middlewares) {
            try {
                await middleware(req, res, fake_next);
                if (error) {
                    return next(error);
                }
            } catch (e) {
                continue;
            }
        }
        next();
    };
}

