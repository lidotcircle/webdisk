import express from 'express';

const router = express.Router();
export default router;

router.use('/basic-info',  require('./basic-info').default);
router.use('/invite-code', require('./invite-code').default);
router.use('/avatar',      require('./avatar').default);
router.use('/setting',     require('./setting').default);
router.use('/account',     require('./account').default);
