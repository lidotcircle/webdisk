import express from 'express';
import { body, validationResult } from 'express-validator';
import { UserService } from '../../service';
import { QueryDependency } from '../../lib/di';
import { getAuthUsername } from '../../middleware';

const router = express.Router();
export default router;


router.post('/', 
    async (req, res) => {
        const username = getAuthUsername(req);
        if (!username) {
            return res.status(401).json({ errors: [{ msg: "Unauthorized" }] });
        }

        const userService = QueryDependency(UserService);
        const invitecode = await userService.createInvitationCode(username);
        res.json({ invitecode:  invitecode });
    }
);

router.delete('/', 
    body('invitecode').isString().isLength({ min: 1 }),
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
        await userService.deleteInvitationCode(username);
        res.status(200).send();
    }
);

