import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { UserService } from '../../service';
import { QueryDependency } from '../../lib/di';
import { getAuthUsername } from '../../middleware';

const router = express.Router();
export default router;


router.post('/', 
    async (req, res) => {
        const username = getAuthUsername(req);
        const userService = QueryDependency(UserService);
        const invitecode = await userService.createInvitationCode(username);
        res.json({ code:  invitecode });
    }
);

router.put('/perms',
    query('invitecode').isString().isLength({ min: 1}).withMessage("rquire invitation code"),
    body('relpath').optional().isString().withMessage("relpath should be string"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        // TODO transaction
        const username = getAuthUsername(req);
        const userService = QueryDependency(UserService);
        const code = req.query['invitecode'];

        let changed = false;
        const invcode = await userService.getInvCode(username, code);
        if (req.body['relpath']) {
            invcode.relativepath = req.body['relpath'];
            changed = true;
        }

        if (changed)
            await userService.saveInvCode(invcode);
        res.status(200).send();
    }
);

router.get('/perms',
    query('invitecode').isString().isLength({ min: 1}).withMessage("rquire invitation code"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const username = getAuthUsername(req);
        const userService = QueryDependency(UserService);
        const code = req.query['invitecode'];

        const invcode = await userService.getInvCode(username, code);
        res.json({
            relpath: invcode.relativepath,
        });
    }
);

router.get('/user',
    query('invitecode').isString().isLength({ min: 1}).withMessage("rquire invitation code"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const username = getAuthUsername(req);
        const userService = QueryDependency(UserService);
        const code = req.query['invitecode'];

        const ans = await userService.getUserInfoByInvCode(username, code);
        res.json(ans);
    }
);

router.get('/',
    async (req, res) => {
        const username = getAuthUsername(req);
        const userService = QueryDependency(UserService);
        const invitecodes = await userService.getInvitationCode(username);
        res.json(invitecodes);
    }
);

router.delete('/', 
    query('invitecode').isString().isLength({ min: 1 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        const username = getAuthUsername(req);
        const code = req.query['invitecode'];
        const userService = QueryDependency(UserService);
        await userService.deleteInvitationCode(username, code);
        res.status(200).send();
    }
);

