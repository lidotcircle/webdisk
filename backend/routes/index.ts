import express from 'express';
import { JWTService } from '../service';
import { QueryDependency } from '../lib/di';

const router = express.Router();
export default router;
export const UserSymbol = Symbol('User');

function jwt_validator(req: express.Request, res: express.Response, next: ()=>void)
{
    const token = req.headers['x-access-token'] as string;
    if (!token) {
        return res.status(401).send({ auth: false, message: 'No token provided.' });
    }
    const jwts = QueryDependency(JWTService);
    if (!jwts.verify(token)) {
        return res.status(401).send({ auth: false, message: 'Failed to authenticate token.' });
    }
    const dtoken = jwts.decode(token);
    req[UserSymbol] = dtoken.username;
    next();
}


router.use('/auth', require('./auth').default);
router.use('/user', jwt_validator, require('./user').default);
