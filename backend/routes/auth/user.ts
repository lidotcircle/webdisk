import express from 'express';
import { body, validationResult } from 'express-validator';
import { UserService } from '../../service';
import { QueryDependency } from '../../lib/di';

const router = express.Router();
export default router;


router.post('/', 
    // TODO more validation for username password 
    body('username').isLength({min:2}).withMessage("username is too short"),
    body('password').isLength({min:6}).withMessage("password is too short"),
    body('inviteCode').isString().withMessage("invite code should be a string"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { username, password, inviteCode } = req.body;
        const userService = QueryDependency(UserService);

        await userService.createUser(username, password, inviteCode);
        res.status(200).json({});
    }
);
