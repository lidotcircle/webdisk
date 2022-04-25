import { getDataSource } from "../index";
import { Note, NoteTag, NoteJoinNoteTag, NoteHistory, User } from '../entity';
import { DIProperty, Injectable } from '../lib/di';
import { EntityManager, Repository } from "typeorm";
import { UserService } from "./user-service";
import { diff_match_patch } from 'diff-match-patch';
import createHttpError from "http-errors";


@Injectable({
    lazy: true
})
export class NoteService {
    private noteRepo: Repository<Note>;
    private tagRepo: Repository<NoteTag>;
    private historyRepo: Repository<NoteHistory>;
    @DIProperty(UserService)
    private userService: UserService;

    constructor() {
        const dataSource = getDataSource();
        this.noteRepo = dataSource.getRepository(Note);
        this.tagRepo = dataSource.getRepository(NoteTag);
        this.historyRepo = dataSource.getRepository(NoteHistory);
    }

    async createNote(username: string, title: string, contentType: string): Promise<number> {
        const user = await this.userService.getUser(username);
        if (!user)
            throw new createHttpError.InternalServerError("500 in createnote");

        const newNote = new Note();
        newNote.user = Promise.resolve(user);
        newNote.userId = user.id;
        newNote.title = title;
        newNote.contentType = contentType
        newNote.content = '';
        newNote.generation = 0;
        const doc = await this.noteRepo.save(newNote);
        return doc.id;
    }

    async getNote(username: string, noteid: number): Promise<Note> {
        return await this.noteRepo
            .createQueryBuilder("note")
            .select()
            .innerJoin(User, "user", "note.userId = user.id")
            .where("note.id = :nid", {nid: noteid})
            .andWhere("user.username = :un", {un: username})
            .getOne();
    }

    async getNotes(username: string, skip: number, take?: number): Promise<{ data: Note[], count: number }> {
        let query = this.noteRepo
            .createQueryBuilder("note")
            .select()
            .innerJoin(User, "user", "note.userId = user.id")
            .where("user.username = :un", {un: username})
            .skip(skip);
        if (take) query = query.take(take);

        const ans = await query.getManyAndCount();
        return { data: ans[0], count: ans[1] };
    }

    async getNoteHistory(username: string, noteid: number, skip: number, take: number) {
        let query = this.historyRepo
            .createQueryBuilder()
            .select("his")
            .innerJoin(Note, "note", "his.noteId = note.id")
            .innerJoin(User, "user", "user.id = note.userId")
            .where("user.username = :un", {un: username})
            .where("note.id = :nid", {nid: noteid})
            .skip(skip);

        if (take != null)
            query = query.take(take);

        return await query.getMany();
    }

    async updateNoteTitle(username: string, noteid: number, newtitle: string): Promise<void> {
        const note = await this.getNote(username, noteid);
        note.title = newtitle;
        await this.noteRepo.save(note);
    }

    async updateNote(username: string, noteid: number, patchText: string): Promise<{ generation: number, inconsistency: number  }> {
        const user = await this.userService.getUser(username);
        if (!user)
            throw new createHttpError.InternalServerError("500 in updatenote");

        const dpm = new diff_match_patch();
        let patch: any[];
        try {
            patch = dpm.patch_fromText(patchText);
        } catch {
            throw new createHttpError.BadRequest(`invalid patch string`);
        }

        let generation: number;
        let inconsistency: number;
        const ds = getDataSource();
        await ds.transaction(async (em: EntityManager) => {
            const np = em.getRepository(Note);
            const hp = em.getRepository(NoteHistory);
            const note = await np.findOneBy({
                id: noteid,
                userId: user.id,
            });

            try {
                const [ newtext, apply_status ]  = dpm.patch_apply(patch, note.content);
                inconsistency = 0;
                for (const s of apply_status) {
                    if (!s)
                        inconsistency++;
                }
                note.content = newtext;
                note.generation++;
                generation = note.generation;

                const newPatch = new NoteHistory();
                newPatch.patch = patchText;
                newPatch.noteId = note.id;
                newPatch.note = Promise.resolve(note);
                await hp.save(newPatch);
                await np.save(note);
            } catch {
                throw new createHttpError.BadRequest('apply patch failed');
            }
        });

        return { 
            generation: generation,
            inconsistency: inconsistency,
        };
    }

    async deleteNote(username: string, noteid: number): Promise<void> {
        const user = await this.userService.getUser(username);
        if (!user)
            throw new createHttpError.InternalServerError("500 in deletenote");

        const ds = getDataSource();
        await ds.transaction(async (em: EntityManager) => {
            const noteRepo = em.getRepository(Note);
            const tagJoinNoteRepo = em.getRepository(NoteJoinNoteTag);
            const tagRepo = em.getRepository(NoteTag);

            const note = await noteRepo.findOneBy({
                userId: user.id,
                id: noteid,
            });

            if (!note) throw new createHttpError.NotFound("note not found");
            const tags = (await tagRepo
                .createQueryBuilder("tag")
                .select("tag.id")
                .innerJoin(NoteJoinNoteTag, "nj", "nj.tagId = tag.id")
                .where("nj.noteId = :nid", {nid: noteid}).getMany()).map(t => t.id);

            const res = await noteRepo
                .createQueryBuilder()
                .delete()
                .from(Note, "note")
                .where("note.id = :nid", {nid: noteid})
                .andWhere("note.userId = :uid", {uid: user.id}).execute();

            if (res.affected == 0)
                throw new createHttpError.InternalServerError("500 in deletenote 0affected");

            for (const tagid of tags) {
                const tagrel = await tagJoinNoteRepo.findOneBy({
                    tagId: tagid,
                });
                if (!tagrel) {
                    await tagRepo.delete({
                        id: tagid,
                    });
                }
            }
        });
    }

    async getNoteByTag(username: string, tag: string, skip: number, take?: number, ascending?: boolean): Promise<{ data: Note[], count: number}> {
        let query = this.noteRepo
            .createQueryBuilder("note")
            .select()
            .innerJoin(User, "user", "note.userId = user.id")
            .innerJoin(NoteJoinNoteTag, "nt", "note.id = nt.noteId")
            .innerJoin(NoteTag, "tag", "tag.id = nt.tagId")
            .where("user.username = :un", {un: username})
            .andWhere("tag.userId = user.id")
            .andWhere("tag.name = :tagname", {tagname: tag})
            .skip(skip);

        if (take) query = query.take(take);
        if (ascending != null) query = query.orderBy("note.id", ascending ? "ASC" : "DESC");

        const [ data, count ] =  await query.getManyAndCount();
        return { data, count };
    }

    /**
     * If the tag doesn't exists then just create it.
     * If the note has own the tag just ignore it.
     */
    async setNoteTags(username: string, noteid: number, tags: string[]): Promise<void>
    {
        const ds = getDataSource();
        await ds.transaction(async (em: EntityManager) => {
            const tagRepo = em.getRepository(NoteTag);
            const tagJoinNoteRepo = em.getRepository(NoteJoinNoteTag);
            const noteRepo = em.getRepository(Note);
            const userRepo = em.getTreeRepository(User);

            const user = await userRepo.findOneBy({username: username});
            if (!user) throw new createHttpError.InternalServerError("500 in setnotetags");

            const note = await noteRepo.findOneBy({id: noteid, userId: user.id});
            if (!note) throw new createHttpError.NotFound("note not found");

            for (const tag of tags) {
                let t = await tagRepo.findOneBy({
                    userId: user.id,
                    name: tag,
                });
                if (!t) {
                    const newtag = new NoteTag();
                    newtag.name = tag;
                    newtag.userId = user.id;
                    newtag.user = Promise.resolve(user);
                    t = await tagRepo.save(newtag);
                }

                const newrel = new NoteJoinNoteTag()
                newrel.noteId = note.id;
                newrel.note = Promise.resolve(note);
                newrel.tag = Promise.resolve(t);
                newrel.tagId = t.id;
                await tagJoinNoteRepo.save(newrel);
            }
        });
    }

    /**
     * If the note hasn't own the tag then throw error.
     * If a tag contains none of notes, then delete it.
     */
    async deleteNoteTags(username: string, noteid: number, tags: string[]): Promise<void>
    {
        const ds = getDataSource();
        await ds.transaction(async (em: EntityManager) => {
            const tagRepo = em.getRepository(NoteTag);
            const tagJoinNoteRepo = em.getRepository(NoteJoinNoteTag);
            const noteRepo = em.getRepository(Note);
            const userRepo = em.getTreeRepository(User);

            const user = await userRepo.findOneBy({username: username});
            if (!user) throw new createHttpError.InternalServerError("500 in deletenotetags");

            const note = await noteRepo.findOneBy({id: noteid, userId: user.id});
            if (!note) throw new createHttpError.NotFound("note not found");

            for (const tag of tags) {
                let t = await tagRepo.findOneBy({
                    userId: user.id,
                    name: tag,
                });
                if (!t) throw new createHttpError.NotFound(`tag '${tag}' not found`);

                const rs = await tagJoinNoteRepo
                    .createQueryBuilder()
                    .delete()
                    .from("rl")
                    .where("rl.tagId = :tid", {tid: t.id})
                    .andWhere("rl.noteId = :nid", {nid: note.id})
                    .execute();

                if (rs.affected == 0) throw new createHttpError.NotFound(`note doesn't contain tag '${tag}'`);

                const nremain = await tagJoinNoteRepo
                    .createQueryBuilder()
                    .select("rl")
                    .innerJoin(NoteTag, "tag", "rl.tagId = tag.id")
                    .where("tag.userId = :uid", {uid: user.id})
                    .where("tag.id = :tid", {tid: t.id})
                    .getCount();

                if (nremain == 0) {
                    await tagRepo.delete({
                        id: t.id
                    });
                }
            }
        });
    }

    async getUserTags(username: string): Promise<string[]> {
        const user = await this.userService.getUser(username);
        if (!user) throw new createHttpError.InternalServerError("500 in getusertags");

        return (await this.tagRepo.find({
            where: {
                userId: user.id
            }
        })).map(v => v.name);
    }

    async getNoteTags(username: string, noteid: number): Promise<string[]> {
        const ds = getDataSource();
        const ans = [];

        await ds.transaction(async (em: EntityManager) => {
            const userRepo = em.getRepository(User);
            const noteRepo = em.getRepository(Note);
            const tagRepo = em.getRepository(NoteTag);

            const user = await userRepo.findOneBy({username: username});
            if (!user) throw new createHttpError.InternalServerError("500 in getnotetags");
            const note = await noteRepo.findOneBy({id: noteid});
            if (!note) throw new createHttpError.NotFound();

            (await tagRepo
                .createQueryBuilder("tag")
                .select("tag.name")
                .innerJoin(NoteJoinNoteTag, "nj", "nj.tagId = tag.id")
                .where("nj.noteId = :nid", {nid: note.id})
                .getMany()).map(t => ans.push(t.name));
        });

        return ans;
    }
}
