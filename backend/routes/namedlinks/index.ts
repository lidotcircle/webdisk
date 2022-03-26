import express from 'express';
import { NamedLinkService } from '../../service';
import { QueryDependency } from '../../lib/di';
import { body, query } from 'express-validator';
import { getJWTAuthUser } from '../../middleware';
import assert from 'assert';

const router = express.Router();
export default router;


router.get('/', 
    async (req, res) => {
        const username = getJWTAuthUser(req);
        assert(username, 'username is not found');

        const service = QueryDependency(NamedLinkService);
        const links = await service.getAllLinks(username);
        res.json(links);
    }
)

router.delete('/',
    query('name').isString().withMessage('name is not string'),
    async (req, res) => {
        const username = getJWTAuthUser(req);
        assert(username, 'username is not found');

        const service = QueryDependency(NamedLinkService);
        const { name } = req.query;
        await service.deleteLink(username, name);
        res.json({});
    }
);

router.post('/',
    body('name').isString().isLength({ min: 2 }).withMessage('name must be at least 2 characters long'),
    body('target').isString().matches(/\/.*/).withMessage('target should be a absolute file path'),
    body('duration_ms').optional().isInt().withMessage('duration should be a integer'),
    async (req, res) => {
        const username = getJWTAuthUser(req);
        assert(username, 'username is not found');

        const service = QueryDependency(NamedLinkService);
        const { name, target, duration_ms } = req.body;
        const ex = duration_ms ? new Date(Date.now() + duration_ms) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 100);
        const link = await service.createLink(username, name, target, ex);
        res.json(link);
    }
);
