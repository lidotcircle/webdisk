import express from 'express';
import { query, body, validationResult } from 'express-validator';
import { DataRecordService, SimpleExpiredStoreService } from '../../service';
import { QueryDependency } from '../../lib/di';
import { createPasswordAuthMiddleware, getAuthUsername, defaultJWTAuthMiddleware, AnyOfNoError } from '../../middleware';
import { v4 as uuidv4 } from "uuid";
import createHttpError from 'http-errors';

const router = express.Router();
export default router;

const passwordAuthMiddleware = createPasswordAuthMiddleware("username", "password");
const defaultAuth = AnyOfNoError(passwordAuthMiddleware, defaultJWTAuthMiddleware);
router.post('/', defaultAuth,
    body('group').isLength({min:2}).withMessage("group is too short"),
    body('data').isLength({min:1}).withMessage("empty data"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { group, data } = req.body;
        const username = getAuthUsername(req);

        const drservice = QueryDependency(DataRecordService);
        await drservice.insert(username, group, data);
        res.status(200).send();
    }
)

router.post('/list', defaultAuth,
    body('datas').isArray().withMessage("should be an array"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { datas } = req.body;
        const username = getAuthUsername(req);

        const drservice = QueryDependency(DataRecordService);
        await drservice.insertListofDatas(username, datas);
        res.status(200).send();
    }
)

router.delete('/', defaultAuth,
    query('group').isString().withMessage("group should be a string"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { group } = req.query;
        const username = getAuthUsername(req);

        const drservice = QueryDependency(DataRecordService);
        await drservice.deleteGroup(username, group);
        res.status(200).send();
    }
)

router.get('/groups', defaultAuth,
    query("sortBy").optional().isLength({min: 2}),
    query("order").optional().isLength({min: 2}),
    async (req, res) => {
        const { sortBy, order } = req.query;

        const username = getAuthUsername(req);
        const drservice = QueryDependency(DataRecordService);
        const groups = await drservice.getGroups(username, sortBy == 'updatedDate', order == 'ASC');
        res.status(200).json(groups);
    }
)

router.get('/data', defaultAuth,
    query('group').isString().withMessage("group should be a string"),
    query('pageno').optional(true).isInt({min:1}).withMessage("pageno must be a positive integer"),
    query('pagesize').optional(true).isInt({min:1}).withMessage("pagesize must be a positive integer"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const pageno = req.query.pageno || 1;
        const pagesize = req.query.pagesize || 10;
        const username = getAuthUsername(req);
        const drservice = QueryDependency(DataRecordService);
        const result = await drservice.getData(username, req.query.group, pageno, pagesize);
        res.status(200).json(result);
    }
)

router.get('/alldata', defaultAuth,
    query('group').isString().withMessage("group should be a string"),
    query('skip').optional(true).isInt({min:0}).withMessage("skip should be a non-negative integer"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const username = getAuthUsername(req);
        const drservice = QueryDependency(DataRecordService);
        const skip = req.query.skip || 0;
        const result = await drservice.getAllData(username, req.query.group, skip);
        res.status(200).json(result);
    }
)

router.post('/backup', defaultAuth,
    body('groups').isArray().withMessage("should be an array"),
    body('duration').isInt({max: 7 * 24 * 60 * 60 * 1000, min: 60 * 1000}).withMessage("should be an integer"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { groups, duration } = req.body;
        const username = getAuthUsername(req);

        const valueStore = QueryDependency(SimpleExpiredStoreService);
        const key = uuidv4();
        valueStore.setval(key, {groups, username}, duration);

        res.status(200).json({backupid: key});
    }
)

router.get('/backup',
    query('backupid').isString().withMessage("backupid is required"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { backupid } = req.query;
        const valueStore = QueryDependency(SimpleExpiredStoreService);
        const info = valueStore.getval<any>(backupid);
        if (!info) {
            throw new createHttpError.BadRequest("invalid backup id");
        }
        const { username, groups } = info;

        const drservice = QueryDependency(DataRecordService);
        const buf = await drservice.backupData(username, groups)
        res.status(200).send(buf);
    }
)
