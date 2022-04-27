import express from 'express';
import { body, query, validationResult } from 'express-validator';
import createHttpError from 'http-errors';
import { QueryDependency } from '../../lib/di';
import { NoteService } from '../../service/note-service';
import { getAuthUsername } from '../../middleware';

const router = express.Router();
export default router;


const safeNumber = (val: any): number => val && !Number.isNaN(Number(val)) ? Number(val) : null;

router.get('/',
    query("pageno").optional().isInt({min: 1}).withMessage("pageno is optional, if presents  pageno should be a positive integer"),
    query("pagesize").optional().isInt({min: 1}).withMessage("pagesize is optional, if presents it should be a positive integer"),
    query("tag").optional().isString(),
    async (req, res) => {
        const valres = validationResult(req);
        if (!valres.isEmpty()) {
            throw new createHttpError.UnprocessableEntity(valres.array()[0].msg);
        }

        const user = getAuthUsername(req);
        const pageno = safeNumber(req.query['pagneo']) || 1;
        const pagesize = safeNumber(req.query['pagesize']) || 5;
        const skip = (pageno  - 1) * pagesize;
        const take = pagesize;
        const tag = req.query['tag'];
        const noteService = QueryDependency(NoteService);

        const ans = tag ? await noteService.getNoteByTag(user, tag, skip, take) : await noteService.getNotes(user, skip, take);
        res.json({
            count: ans.count,
            data: ans.data.map(note => {

                return {
                    generation: note.generation,
                    content: note.content,
                    contentType: note.contentType,
                    title: note.title,
                    id: note.id,
                    createdAt: note.createdAt.toISOString(),
                };
            })
        });
    }
);

router.get('/single',
    query("noteid").isInt(),
    query("generation").optional().isInt(),
    async (req, res) => {
        const valres = validationResult(req);
        if (!valres.isEmpty()) {
            throw new createHttpError.UnprocessableEntity(valres.array()[0].msg);
        }

        const user = getAuthUsername(req);
        const noteid = safeNumber(req.query['noteid']);
        const generation = safeNumber(req.query['generation']);
        const noteService = QueryDependency(NoteService);

        const note = (generation != null ? 
            await noteService.getNoteHistoryVersion(user, noteid, generation) :
            await noteService.getNote(user, noteid));
        if (!note) throw new createHttpError.NotFound("note not found, ??");
        res.json({
            generation: note.generation,
            content: note.content,
            contentType: note.contentType,
            title: note.title,
            id: note.id,
            createdAt: note.createdAt.toISOString(),
        });
    }
);

router.post('/',
    body("title").isString().isLength({min: 1}),
    body("contentType").matches(/(markdown|todo)/),
    async (req, res) => {
        const valres = validationResult(req);
        if (!valres.isEmpty()) {
            throw new createHttpError.UnprocessableEntity(valres.array()[0].msg);
        }

        const user = getAuthUsername(req);
        const { title, contentType } = req.body;

        const noteService = QueryDependency(NoteService);
        const noteid = await noteService.createNote(user, title, contentType);
        res.json({
            noteid: noteid,
        });
    }
);

router.delete('/',
    query("noteid").isInt(),
    async (req, res) => {
        const valres = validationResult(req);
        if (!valres.isEmpty()) {
            throw new createHttpError.UnprocessableEntity(valres.array()[0].msg);
        }

        const user = getAuthUsername(req);
        const noteid = safeNumber(req.query['noteid']);

        const noteService = QueryDependency(NoteService);
        await noteService.deleteNote(user, noteid);
        res.status(200).send();
    }
);

router.put('/title',
    body("noteid").isInt(),
    body("title").isString().isLength({min: 1}),
    async (req, res) => {
        const valres = validationResult(req);
        if (!valres.isEmpty()) {
            throw new createHttpError.UnprocessableEntity(valres.array()[0].msg);
        }

        const user = getAuthUsername(req);
        const noteid = safeNumber(req.query['noteid']);
        const title = req.query['title'];

        const noteService = QueryDependency(NoteService);
        await noteService.updateNoteTitle(user, noteid, title);
        res.status(200).send();
    }
);

router.put('/',
    body("noteid").isInt(),
    body("patch").isString().isLength({min: 1}),
    async (req, res) => {
        const valres = validationResult(req);
        if (!valres.isEmpty()) {
            throw new createHttpError.UnprocessableEntity(valres.array()[0].msg);
        }

        const user = getAuthUsername(req);
        const { noteid, patch } = req.body;

        const noteService = QueryDependency(NoteService);
        const result = await noteService.updateNote(user, noteid, patch);
        res.json(result);
    }
);

router.get('/tags',
    query("noteid").optional().isInt(),
    async (req, res) => {
        const valres = validationResult(req);
        if (!valres.isEmpty()) {
            throw new createHttpError.UnprocessableEntity(valres.array()[0].msg);
        }

        const noteid = req.query["noteid"];
        const user = getAuthUsername(req);
        const noteService = QueryDependency(NoteService);
        const result = noteid != null ? await noteService.getNoteTags(user, noteid) : await noteService.getUserTags(user);
        res.json(result);
    }
);

router.get('/history',
    query("noteid").isInt().withMessage("noteid is required"),
    query("skip").isInt({min: 0}).withMessage("skip should be a non-negative integer"),
    query("take").optional().isInt({min: 1}).withMessage("take is optional, if presents it should be a positive integer"),
    query("order").optional().isString(),
    async (req, res) => {
        const valres = validationResult(req);
        if (!valres.isEmpty()) {
            throw new createHttpError.UnprocessableEntity(valres.array()[0].msg);
        }

        const user = getAuthUsername(req);
        const noteid = safeNumber(req.query['noteid']);
        const skip = safeNumber(req.query['skip']);
        const take = safeNumber(req.query['take']);
        const order = req.query['order'];
        const noteService = QueryDependency(NoteService);

        const [ data, count ] = await noteService.getNoteHistory(user, noteid, skip, take || 10, order == "ASC");
        res.json({
            count: count,
            data: data.map(his => {
                return {
                    patch: his.patch,
                    createdAt: his.createdAt.toISOString(),
                };
            })
        });
    }
);

router.delete('/history',
    query("noteid").isInt(),
    query("generationStart").isInt({min: 1}),
    query("generationEnd").optional().isInt(),
    async (req, res) => {
        const valres = validationResult(req);
        if (!valres.isEmpty()) {
            throw new createHttpError.UnprocessableEntity(valres.array()[0].msg);
        }

        const user = getAuthUsername(req);
        const noteid = safeNumber(req.query['noteid']);
        const generationStart = safeNumber(req.query['generationStart']);
        let generationEnd = safeNumber(req.query['generationEnd']);
        const noteService = QueryDependency(NoteService);
        if (!generationEnd) {
            generationEnd = generationStart + 1;
        } else if (generationStart >= generationEnd) {
            throw new createHttpError.UnprocessableEntity(`bad history range (${generationStart},${generationEnd})`);
        }

        await noteService.deleteNoteHistory(user, noteid, generationStart, generationEnd);
        res.status(200).send();
    }
);

router.get('/generation',
    query("noteid").isInt().withMessage("noteid is required and should be a integer"),
    async (req, res) => {
        const valres = validationResult(req);
        if (!valres.isEmpty()) {
            throw new createHttpError.UnprocessableEntity(valres.array()[0].msg);
        }

        const noteid = safeNumber(req.query['noteid']);
        const user = getAuthUsername(req);
        const noteService = QueryDependency(NoteService);
        const note = await noteService.getNote(user, noteid);

        res.json({
            generation: note.generation,
        });
    }
);
