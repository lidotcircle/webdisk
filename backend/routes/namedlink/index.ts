import express from 'express';
import { NamedLinkService } from '../../service';
import { QueryDependency } from '../../lib/di';
import path from 'path';

const router = express.Router();
export default router;


router.get('/:link', 
    async (req, res) => {
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

        // TODO: redirect to the actual link in different filesystem
        const p = path.join(entry.user.rootpath, entry.target.substring(1));
        res.download(p, link);
    }
)
