import express from 'express';
import { body, validationResult } from 'express-validator';
import { UserService } from '../../service';
import { QueryDependency } from '../../lib/di';
import { getAuthUsername } from '../../middleware';
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

        const username = getAuthUsername(req);
        if (!username)
            return new createError.Unauthorized();

        const userService = QueryDependency(UserService);
        await userService.setProfilePicture(username, req.body.avatar);
        res.status(200).send();
    }
);

router.post('/blob',
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const username = getAuthUsername(req);
        if (!username)
            return new createError.Unauthorized();

        const chunks = [];
        for await (let chunk of req) {
            chunks.push(chunk);
        }
        const buf = Buffer.concat(chunks).toString("base64");

        const userService = QueryDependency(UserService);
        await userService.setProfilePicture(username, buf);
        res.status(200).send();
    }
);

router.get('/', 
    async (req, res) => {
        const username = getAuthUsername(req);
        if (!username) {
            return res.status(401).json({ errors: [{ msg: "Unauthorized" }] });
        }

        const userService = QueryDependency(UserService);
        const avatar = await userService.getProfilePicture(username);
        res.status(200).json({ avatar: avatar });
    }
);

router.get('/blob', 
    async (req, res) => {
        const username = getAuthUsername(req);
        if (!username) {
            return res.status(401).json({ errors: [{ msg: "Unauthorized" }] });
        }

        const userService = QueryDependency(UserService);
        const avatar = await userService.getProfilePicture(username);
        if (Buffer.from(avatar, 'base64').toString('base64') === avatar) {
            res.send(Buffer.from(avatar, "base64"));
        } else {
            res.status(200).send();
        }
    }
);

