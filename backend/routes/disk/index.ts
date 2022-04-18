import express, { Request, Response } from 'express';
import { UserService } from '../../service';
import { QueryDependency } from '../../lib/di';
import { createSTokenAuthMiddleware, getAuthUsername, defaultJWTAuthMiddleware, AnyOfNoError, createPasswordAuthMiddleware } from '../../middleware';
import path from 'path';
import createHttpError from 'http-errors';
import { write_file_response } from '../../lib/utils';

const router = express.Router();
export default router;


const passAuthMiddleware = createPasswordAuthMiddleware("username", "password");
const stokenAuthMiddleware = createSTokenAuthMiddleware("download");
const defaultAuth = AnyOfNoError(passAuthMiddleware, stokenAuthMiddleware, defaultJWTAuthMiddleware);

const handler = async (req: Request, res: Response) => {
    const qpos = req.url.indexOf('?');
    const uripath = qpos > 0 ? req.url.substring(0, qpos) : req.url;
    const username = getAuthUsername(req);
    const userService = QueryDependency(UserService);
    const user = await userService.getUser(username);
    if (!user)
        throw new createHttpError.NotFound();

    const fn = path.join(user.rootpath, decodeURIComponent(uripath));
    await write_file_response(fn, req.headers, res);
}

router.get(/\/.*/, defaultAuth, handler);
router.head(/\/.*/, defaultAuth, handler);
