import express from 'express';
import { query, body, validationResult } from 'express-validator';
import { StorageBackendService } from '../../service';
import { QueryDependency } from '../../lib/di';
import { getAuthUsername } from '../../middleware';

const router = express.Router();
export default router;

router.post('/',
    body('type').isString().withMessage('storage type is required'),
    body('directory').isString().withMessage('directory is required'),
    body('config').isObject().withMessage('storage config is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { type, directory, config } = req.body;
        const username = getAuthUsername(req);

        const service = QueryDependency(StorageBackendService);
        await service.addStorageBackend(username, type, directory, config);
        res.status(200).send();
    }
);

router.delete('/',
    query('directory').isString().withMessage("directory is required"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { directory } = req.query;
        const username = getAuthUsername(req);

        const service = QueryDependency(StorageBackendService);
        await service.removeStorage(username, directory);
        res.status(200).send();
    }
);

router.put('/',
    body('directory').isInt().withMessage('directory is required'),
    body('config').isObject().withMessage('storage config is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { directory, config } = req.body;
        const username = getAuthUsername(req);

        const service = QueryDependency(StorageBackendService);
        await service.modifyStorageConfig(username, directory, config);
        res.status(200).send();
    }
);

router.get('/',
    async (req, res) => {
        const username = getAuthUsername(req);
        const service = QueryDependency(StorageBackendService);
        res.json(await service.getStorages(username));
    }
);

