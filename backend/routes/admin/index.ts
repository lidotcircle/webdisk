import express, { NextFunction, Response, Request } from 'express';
import createHttpError from 'http-errors';
import { createPasswordAuthMiddleware, getAuthUsername, defaultJWTAuthMiddleware, AnyOfNoError, AllOfNoError } from '../../middleware';

const router = express.Router();
export default router;

const passwordAuthMiddleware = createPasswordAuthMiddleware("username", "password");
const defaultAuth = AllOfNoError(
    AnyOfNoError(passwordAuthMiddleware, defaultJWTAuthMiddleware),
    (req: Request, _res: Response, next: NextFunction) => {
        const username = getAuthUsername(req);
        if (username != "admin") {
            next(new createHttpError.BadRequest("not administrator account"));
        } else {
            next();
        }
    }
);

router.use('/restart', defaultAuth, require('./restart').default);
router.use('/update',  defaultAuth, require('./update').default);
