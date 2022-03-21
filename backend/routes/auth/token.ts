import express from 'express';
import { body, validationResult } from 'express-validator';
import { UserService } from '../../service';
import { QueryDependency } from '../../lib/di';

const router = express.Router();
export default router;


router.post('/', 
    body('username').isString().withMessage("username should be a string"),
    body('password').isString().withMessage("password should be a string"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        const userService = QueryDependency(UserService);

        const refreshtoken = await userService.login(username, password);
        res.status(200).json({
            token: refreshtoken
        });
    }
);
