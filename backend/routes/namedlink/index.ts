import express from 'express';
import { NamedLinkService } from '../../service';
import { QueryDependency } from '../../lib/di';

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

        res.download(entry.target, link);
    }
)
