import express from 'express';
import { query, validationResult } from 'express-validator';
import { QueryDependency } from '../../lib/di';
import { UserService } from '../../service';
import { getJWTAuthUser } from '../../middleware';
import assert from 'assert';


const router = express.Router();
export default router;

router.delete('/',
    query('password').isString().withMessage('password must be a string'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { password } = req.query;
        const username = getJWTAuthUser(req);
        assert(username, 'username must be set');
        const userService = QueryDependency(UserService);
        if (!await userService.verifyUsernamePassword(username, password)) {
            return res.status(401).json({ error: 'password is incorrect' });
        }

        await userService.deleteUser(username);
        res.status(200).send();
    }
);
