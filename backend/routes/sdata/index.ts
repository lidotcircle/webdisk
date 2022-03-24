import express from 'express';

const router = express.Router();
export default router;

router.use('/', require('./sdata').default);
