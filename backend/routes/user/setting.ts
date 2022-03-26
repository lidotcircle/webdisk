import express from 'express';
import { body, validationResult } from 'express-validator';
import { UserService } from '../../service';
import { QueryDependency } from '../../lib/di';
import { getJWTAuthUser } from '../../middleware';
import createError from 'http-errors';

const router = express.Router();
export default router;


router.post('/frontend',
    body('setting').isString().withMessage('setting is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const username = getJWTAuthUser(req);
        if (!username)
            return new createError.Unauthorized();

        const userService = QueryDependency(UserService);
        await userService.setFrontendSettings(username, req.body.setting);
        res.status(200).send();
    }
);

router.get('/frontend',
    async (req, res) => {
        const username = getJWTAuthUser(req);
        if (!username)
            return new createError.Unauthorized();

        const userService = QueryDependency(UserService);
        const setting = await userService.getFrontendSettings(username);
        res.status(200).json({ setting: setting});
    }
);

