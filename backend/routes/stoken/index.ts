import express from 'express';
import { query, body, validationResult } from 'express-validator';
import { UserTokenService } from '../../service';
import { QueryDependency } from '../../lib/di';
import { getAuthUsername } from '../../middleware';
import createHttpError from 'http-errors';

const router = express.Router();
export default router;

router.post('/',
    body('durationMs').isInt().withMessage('duration is required'),
    body('usages').isString().withMessage('usages is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { durationMs, usages } = req.body;
        const username = getAuthUsername(req);
        const _durationMs = Number(durationMs || 0) || 0;
        const _usages = (usages as string).split(",");

        const service = QueryDependency(UserTokenService);
        const token = await service.create(username, _usages, _durationMs);
        res.status(200).json({token: token});
    }
);

router.delete('/',
    query('token').isString().withMessage("token is required"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { token } = req.query;
        const username = getAuthUsername(req);

        const service = QueryDependency(UserTokenService);
        if (!await service.deleteToken(username, token)) {
            throw new createHttpError.NotFound();
        }
        res.status(200).send();
    }
);

router.get('/',
    query('pageno').optional(true).isInt({min:1}).withMessage("pageno must be a positive integer"),
    query('pagesize').optional(true).isInt({min:1}).withMessage("pagesize must be a positive integer"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const pageno = req.query.pageno || 1;
        const pagesize = req.query.pagesize || 10;
        const username = getAuthUsername(req);
        const service = QueryDependency(UserTokenService);
        const ans = await service.getTokens(username, pageno, pagesize);
        res.status(200).json(ans);
    }
);

