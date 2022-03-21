import express from 'express';

const router = express.Router();
export default router;

router.use('/invite-code', require('./invite-code').default);
