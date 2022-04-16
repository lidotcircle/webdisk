import express, { Request, Response } from 'express';
import { NamedLinkService } from '../../service';
import { QueryDependency } from '../../lib/di';
import path from 'path';
import { syserr2httperr, write_file_response } from '../../lib/utils';

const router = express.Router();
export default router;


const handler =  async (req: Request, res: Response) => {
        const link = req.params['link'];
        const service = QueryDependency(NamedLinkService);
        const entry = await service.getLink(link);
        if (!entry) {
            res.status(404).send(`'${link}' Not found`);
            return;
        }
        if (new Date(entry.expireAt).getTime() < Date.now()) {
            res.status(410).send(`'${link}' expired`);
            return;
        }

        const filename = path.join(entry.user.rootpath, entry.target.substring(1));
        try {
            await write_file_response(filename, req.headers, res, {
                attachment: true,
                method_head: req.method.toLowerCase() == 'head',
                attachmentFilename: link,
            });
        } catch (e: any) {
            e = syserr2httperr(e);
            throw e;
        }
    }

router.head('/:link', handler)
router.get ('/:link', handler)
