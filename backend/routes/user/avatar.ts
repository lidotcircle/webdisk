import express from 'express';
import { body, validationResult } from 'express-validator';
import { UserService } from '../../service';
import { QueryDependency } from '../../lib/di';
import { getJWTAuthUser } from '../../middleware';
import createError from 'http-errors';

const router = express.Router();
export default router;


router.post('/',
    body('avatar').isString().withMessage('avatar must be a string'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const username = getJWTAuthUser(req);
        if (!username)
            return new createError.Unauthorized();

        const userService = QueryDependency(UserService);
        await userService.setProfilePicture(username, req.body.avatar);
        res.status(200).send();
    }
);

router.get('/', 
    async (req, res) => {
        const username = getJWTAuthUser(req);
        if (!username) {
            return res.status(401).json({ errors: [{ msg: "Unauthorized" }] });
        }

        const userService = QueryDependency(UserService);
        const avatar = await userService.getProfilePicture(username);
        res.status(200).json({ avatar: avatar });
    }
);

