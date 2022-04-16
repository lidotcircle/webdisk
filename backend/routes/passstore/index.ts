import express from 'express';
import { query, body, validationResult } from 'express-validator';
import { PasswordStoreService } from '../../service';
import { QueryDependency } from '../../lib/di';
import { getAuthUsername } from '../../middleware';

const router = express.Router();
export default router;

router.post('/',
    body('site').isString().withMessage('site is required'),
    body('account').isString().withMessage('account is required'),
    body('password').isString().withMessage('password is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { site, account, password } = req.body;
        const username = getAuthUsername(req);

        const psservice = QueryDependency(PasswordStoreService);
        const newid = await psservice.createPass(username, site, account, password);
        res.status(200).json({id: newid});
    }
)

router.put('/',
    body('id').isInt().withMessage('id is required'),
    body('site').isString().withMessage('site is required'),
    body('account').isString().withMessage('account is required'),
    body('password').isString().withMessage('password is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { id, site, account, password } = req.body;
        const username = getAuthUsername(req);

        const psservice = QueryDependency(PasswordStoreService);
        await psservice.updatePass(id, username, site, account, password);
        res.status(200).send();
    }
)

router.delete('/',
    query('id').isInt().withMessage("id should be a number"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { id } = req.query;
        const username = getAuthUsername(req);

        const psservice = QueryDependency(PasswordStoreService);
        await psservice.deletePass(id, username);
        res.status(200).send();
    }
)

router.get('/',
    async (req, res) => {
        const username = getAuthUsername(req);
        const psservice = QueryDependency(PasswordStoreService);
        const result = await psservice.getPasswords(username);
        res.status(200).json(result);
    }
)
