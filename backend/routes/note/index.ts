import express from 'express';
import { body, query, validationResult } from 'express-validator';
import createHttpError from 'http-errors';
import { QueryDependency } from '../../lib/di';
import { NoteService } from '../../service/note-service';
import { getAuthUsername } from '../../middleware';

const router = express.Router();
export default router;


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
        const pageno = req.query['pagneo'] || 1;
        const pagesize = req.query['pagesize'] || 5;
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
    async (req, res) => {
        const valres = validationResult(req);
        if (!valres.isEmpty()) {
            throw new createHttpError.UnprocessableEntity(valres.array()[0].msg);
        }

        const user = getAuthUsername(req);
        const noteid = req.query['noteid'];
        const noteService = QueryDependency(NoteService);

        const note = await noteService.getNote(user, noteid);
        if (!note) throw new createHttpError.NotFound("note not found");
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
        const { noteid } = req.query;

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
        const { noteid, title } = req.query;

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
    async (req, res) => {
        const valres = validationResult(req);
        if (!valres.isEmpty()) {
            throw new createHttpError.UnprocessableEntity(valres.array()[0].msg);
        }

        const user = getAuthUsername(req);
        const { noteid, skip, take } = req.query;
        const noteService = QueryDependency(NoteService);

        res.json(await noteService.getNoteHistory(user, noteid, skip, take));
    }
);

router.get('/generation',
    query("noteid").isInt().withMessage("noteid is required and should be a integer"),
    async (req, res) => {
        const valres = validationResult(req);
        if (!valres.isEmpty()) {
            throw new createHttpError.UnprocessableEntity(valres.array()[0].msg);
        }

        const noteid = Number(req.query['noteid']);
        const user = getAuthUsername(req);
        const noteService = QueryDependency(NoteService);
        const note = await noteService.getNote(user, noteid);

        res.json({
            generation: note.generation,
        });
    }
);
