import express from 'express';
import { UserService } from '../../service';
import { QueryDependency } from '../../lib/di';
import { getAuthUsername } from '../../middleware';
import { body, validationResult } from 'express-validator';

const router = express.Router();
export default router;


router.get('/', 
    async (req, res) => {
        const username = getAuthUsername(req);
        if (!username) {
            return res.status(401).json({ errors: [{ msg: "Unauthorized" }] });
        }

        const userService = QueryDependency(UserService);
        const info = await userService.getBasicInfo(username);
        res.status(200).json(info);
    }
);

router.post('/password',
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('oldpassword').isString().withMessage('Old password must be a string'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const username = getAuthUsername(req);
        if (!username) {
            return res.status(401).json({ errors: [{ msg: "Unauthorized" }] });
        }

        const userService = QueryDependency(UserService);
        const { password, oldpassword } = req.body;
        await userService.changeUserPassword(username, oldpassword, password);
        res.status(200).send();
    }
);
