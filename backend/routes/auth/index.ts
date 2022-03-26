import express from 'express';

const router = express.Router();
export default router;

router.use('/token',          require('./token').default);
router.use('/user',           require('./user').default);
router.use('/jwt',            require('./jwt').default);
router.use('/reset-password', require('./reset-password').default);
