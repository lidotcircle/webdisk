import express from 'express';
import { body, validationResult } from 'express-validator';
import { UserService, SimpleExpiredStoreService } from '../../service';
import { QueryDependency } from '../../lib/di';
import { v4 as uuid } from 'uuid';

const router = express.Router();
export default router;


router.post('/token', 
    body('username').isString().withMessage("username is required"),
    body('inviteCode').isString().withMessage("invitation code should be a string"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { username, inviteCode } = req.body;
        const userService = QueryDependency(UserService);
        if (await userService.validateUserWithInvcode(username, inviteCode)) {
            const token = uuid();
            const storeService = QueryDependency(SimpleExpiredStoreService);
            storeService.setval(token, username, 1000 * 60 * 5);
            return res.json({ token: token });
        } else {
            return res.status(422).json({ errors: [{ msg: "invalid username or invitation code" }] });
        }
    }
)

router.post('/password',
    body('token').isString().withMessage("token is required"),
    body('password').isString().withMessage("password is required"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { token, password } = req.body;
        const storeService = QueryDependency(SimpleExpiredStoreService);
        const username = storeService.getval(token) as string;
        if (username && typeof username === 'string') {
            const userService = QueryDependency(UserService);
            await userService.setUserPassword(username, password);
            return res.json({ msg: "password updated" });
        } else {
            return res.status(422).json({ errors: [{ msg: "invalid token" }] });
        }
    }
)
