import express, { Request, Response } from 'express';
import { UserUploadFileService } from '../../service';
import { QueryDependency } from '../../lib/di';
import { createPasswordAuthMiddleware, getAuthUsername, defaultJWTAuthMiddleware, AnyOfNoError } from '../../middleware';
import { query } from 'express-validator';
import path from 'path';
import createHttpError from 'http-errors';

const router = express.Router();
export default router;


const passwordAuthMiddleware = createPasswordAuthMiddleware("username", "password");
const defaultAuth = AnyOfNoError(passwordAuthMiddleware, defaultJWTAuthMiddleware);
const handler = async (req: Request, res: Response) => {
        const fileid = req.params['fileid'];
        const filename = req.query['filename'] as string;
        const service = QueryDependency(UserUploadFileService);
        await service.downloadFile(fileid, req, res, filename);
    }
router.get('/:fileid', handler);
router.head('/:fileid', handler);

router.post('/', defaultAuth,
    query('filepath').isString(),
    async (req, res) => {
        const service = QueryDependency(UserUploadFileService);
        const user = getAuthUsername(req);
        const filepath: string = req.query['filepath'];
        if (!path.isAbsolute(filepath) || /\.\./.test(filepath)) {
            throw new createHttpError.BadRequest(`filepath should be a absolute path, got '${filepath}'`);
        }
        const fileid = await service.saveToFile(user, filepath, req);
        return res.status(200).json({ fileid: fileid });
    }
)
