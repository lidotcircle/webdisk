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
    body('invitecode').isString().withMessage("invite code should be a string"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { username, password, invitecode } = req.body;
        const userService = QueryDependency(UserService);

        await userService.createUser(username, password, invitecode);
        res.status(200).json({});
    }
);
