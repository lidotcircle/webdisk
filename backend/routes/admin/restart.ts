import express, { Response } from 'express';
import { restartProcess } from '../../lib/utils';

const router = express.Router();
export default router;

router.post('/', async (_, res: Response) => {
    setTimeout(() => {
        restartProcess();
    }, 3000);
    res.status(200).send((new Date()).toUTCString());
});
