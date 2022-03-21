import express from 'express';
import { body, validationResult } from 'express-validator';
import { UserService } from '../../service';
import { UserSymbol } from '..';
import { QueryDependency } from '../../lib/di';

const router = express.Router();
export default router;


router.post('/invite-code', 
    async (req, res) => {
        const username = req[UserSymbol];
        if (!username) {
            return res.status(401).json({ errors: [{ msg: "Unauthorized" }] });
        }

        const userService = QueryDependency(UserService);
        const invitecode = await userService.createInvitationCode(username);
        res.json({ invitecode:  invitecode });
    }
);

router.delete('/invite-code', 
    body('invitecode').isString().isLength({ min: 1 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        const username = req[UserSymbol];
        if (!username) {
            return res.status(401).json({ errors: [{ msg: "Unauthorized" }] });
        }

        const userService = QueryDependency(UserService);
        await userService.deleteInvitationCode(username);
        res.status(200);
    }
);

