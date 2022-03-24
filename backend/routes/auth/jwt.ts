import express from 'express';
import { query, validationResult } from 'express-validator';
import { UserService } from '../../service';
import { QueryDependency } from '../../lib/di';

const router = express.Router();
export default router;


router.get('/', 
    query('token').isString().withMessage('token must be a string'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const userService = QueryDependency(UserService);
        const jwt = await userService.refresh(req.query.token);
        return res.json({
            jwt: jwt
        });
    }
);
