import { getDataSource } from "../index";
import { Note, NoteTag, NoteJoinNoteTag, NoteHistory, User } from '../entity';
import { DIProperty, Injectable } from '../lib/di';
import { EntityManager, Repository } from "typeorm";
import { UserService } from "./user-service";
import { diff_match_patch } from 'diff-match-patch';
import createHttpError from "http-errors";
import { reversePatch } from "../lib/utils";
import assert from "assert";


interface ServiceRepositories {
    readonly noteRepo:    Repository<Note>;
    readonly tagRepo:     Repository<NoteTag>;
    readonly historyRepo: Repository<NoteHistory>;
    readonly userRepo:    Repository<User>;
};

interface PageOptions {
    sortBy?: string;
    ascending?: boolean;
    notetype?: string;
};

function EntityManager2Repos(em: EntityManager): ServiceRepositories
{
    return {
        noteRepo:    em.getRepository(Note),
        tagRepo:     em.getRepository(NoteTag),
        historyRepo: em.getRepository(NoteHistory),
        userRepo: em.getRepository(User),
    };
}

@Injectable({
    lazy: true
})
export class NoteService implements ServiceRepositories {
    noteRepo: Repository<Note>;
    tagRepo: Repository<NoteTag>;
    historyRepo: Repository<NoteHistory>;
    userRepo: Repository<User>;
    @DIProperty(UserService)
    private userService: UserService;

    constructor() {
        const dataSource = getDataSource();
        this.noteRepo = dataSource.getRepository(Note);
        this.tagRepo = dataSource.getRepository(NoteTag);
        this.historyRepo = dataSource.getRepository(NoteHistory);
        this.userRepo = dataSource.getRepository(User);
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

    async getNote(username: string, noteid: number, repos?: ServiceRepositories): Promise<Note> {
        repos = repos || this;

        return await repos.noteRepo
            .createQueryBuilder("note")
            .select()
            .innerJoin(User, "user", "note.userId = user.id")
            .where("note.id = :nid", {nid: noteid})
            .andWhere("user.username = :un", {un: username})
            .getOne();
    }

    async getNoteHistoryVersion(username: string, noteid: number, generation: number, repos?: ServiceRepositories): Promise<Note> {
        let note: Note;
        const query = async (repos: ServiceRepositories) => {
            const latestNote = await this.getNote(username, noteid, repos);

            if (!latestNote)
                throw new createHttpError.NotFound("note not found, hv");
            if (generation > latestNote.generation)
                throw new createHttpError.BadRequest("bad generation");

            if (generation == latestNote.generation) {
                note = latestNote;
                return;
            }

            const histories = await repos.historyRepo
                .createQueryBuilder("his")
                .select()
                .where("his.noteId = :nid", {nid: latestNote.id})
                .orderBy("his.id", "DESC")
                .take(latestNote.generation - generation)
                .getMany();

            const dmp = new diff_match_patch();
            for (const h of histories) {
                const patch = reversePatch(dmp.patch_fromText(h.patch));
                const [ newcontent, patchStatus ] = dmp.patch_apply(patch, latestNote.content);
                if (patchStatus.length > 0 && !patchStatus.reduce((a, b) => a && b)) {
                    throw new createHttpError.InternalServerError("inconsistent patch");
                }
                latestNote.generation--;
                latestNote.content = newcontent;
            }

            note = latestNote;
        };
        if (repos) {
            await query(repos);
        } else {
            const ds = getDataSource();
            await ds.transaction(async (em: EntityManager) => await query(EntityManager2Repos(em)));
        }

        return note;
    }

    private async getUserByUsername(username: string, repos?: ServiceRepositories) {
        repos = repos || this;

        return await repos.userRepo
            .createQueryBuilder("user")
            .select()
            .where("user.username = :un", {un: username})
            .getOne();
    }

    async getNoteHistory(username: string, noteid: number, skip: number, take: number, ascending: boolean) {
        let ans: [NoteHistory[], number] = [null, null];

        const ds = getDataSource();
        await ds.transaction(async (em: EntityManager) => {
            const repos = EntityManager2Repos(em);
            // whether including this query into transction ?
            const user = await this.getUserByUsername(username, repos);
            if (!user) throw new createHttpError.InternalServerError();

            ans = await this.getNoteHistoryV2(user.id, noteid, skip, take, ascending, repos);
        });
        return ans;
    }

    private async getNoteHistoryV2(
        userid: number, noteid: number, skip: number, take: number, 
        ascending: boolean, repos?: ServiceRepositories)
    {
        repos = repos || this;
        let query = repos.historyRepo
            .createQueryBuilder("his")
            .select()
            .innerJoin(Note, "note", "his.noteId = note.id");

        if (userid != null)
            query = query.where("note.userId = :uid", {uid: userid})

        query = query.where("note.id = :nid", {nid: noteid})
            .orderBy("his.id", ascending ? "ASC" : "DESC")
            .skip(skip);

        if (take != null)
            query = query.take(take);

        return await query.getManyAndCount();
    }

    private async getNoteHistoryV3(noteid: number, generation: number, repos: ServiceRepositories): Promise<NoteHistory> {
        const qr = await this.getNoteHistoryV2(null, noteid, generation - 1, 1, true, repos);
        if (!qr || !qr[0] || qr[0].length != 1) return null;
        return qr[0][0];
    }

    private async deleteNoteHistoryRange(noteid: number, hisBeg: number, hisEnd: number, repos: ServiceRepositories) {
        const beg = await this.getNoteHistoryV3(noteid, hisBeg, repos);
        const end = await this.getNoteHistoryV3(noteid, hisEnd - 1, repos);

        const result = await repos.historyRepo
            .createQueryBuilder()
            .delete()
            .where("noteId = :nid", {nid: noteid})
            .where("id >= :hbeg", {hbeg: beg.id})
            .andWhere("id <= :hend", {hend: end.id})
            .execute();
        if (result.affected != (hisEnd - hisBeg))
            throw new createHttpError.InternalServerError();
    }

    async deleteNoteHistory(username: string, noteid: number, hisBeg: number, hisEnd: number) {
        assert(hisBeg < hisEnd && hisBeg >= 1);
        const ds = getDataSource();
        await ds.transaction(async (em: EntityManager) => {
            const repos = EntityManager2Repos(em);
            const user = await this.getUserByUsername(username, repos);
            const note = await this.getNote(username, noteid, repos);
            if (!note) throw new createHttpError.NotFound("note not found, history");

            // TODO merge patches, possible ?
            const dmp = new diff_match_patch();
            if (hisEnd <= note.generation) {
                const hv  = await this.getNoteHistoryVersion(username, noteid, hisEnd, repos);
                let c1 = '';
                if (hisBeg > 1) {
                    const ohv  = await this.getNoteHistoryVersion(username, noteid, hisBeg - 1, repos);
                    c1 = ohv.content;
                }
                const patchText = dmp.patch_toText(dmp.patch_make(c1, hv.content));
                const pl = await this.getNoteHistoryV2(user.id, noteid, hisEnd - 1, 1, true, repos);
                if (!pl || !pl[0] || pl[0].length != 1) {
                    throw new createHttpError.InternalServerError();
                }
                const p = pl[0][0];
                p.patch = patchText;
                await repos.historyRepo.save(p);
            } else if (hisEnd == note.generation + 1) {
                let newcontent = '';
                if (hisBeg > 0) {
                    const hv = await this.getNoteHistoryVersion(username, noteid, hisBeg - 1);
                    newcontent = hv.content;
                }
                note.content = newcontent;
            } else {
                throw new createHttpError.BadRequest("request out of range of note history");
            }

            note.generation -= (hisEnd - hisBeg);
            await this.deleteNoteHistoryRange(noteid, hisBeg, hisEnd, repos);
            await repos.noteRepo.save(note);
        });
    }

    async updateNoteTitle(username: string, noteid: number, newtitle: string): Promise<void> {
        const note = await this.getNote(username, noteid);
        if (!note) throw new createHttpError.NotFound(`${username}, ${noteid}`);
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

    async getNotes(username: string, skip: number, take?: number, tag?: number, options?: PageOptions): Promise<{ data: Note[], count: number}> {
        options = options || {};

        let query = this.noteRepo
            .createQueryBuilder("note")
            .select()
            .innerJoin(User, "user", "note.userId = user.id");

        if (tag) {
            query = query
                .innerJoin(NoteJoinNoteTag, "nt", "note.id = nt.noteId")
                .innerJoin(NoteTag, "tag", "tag.id = nt.tagId")
                .andWhere("tag.userId = user.id")
                .andWhere("tag.name = :tagname", {tagname: tag});
        }
        query = query.where("user.username = :un", {un: username});

        if (options.notetype && options.notetype != 'all')
            query = query.andWhere("note.contentType = :nt", {nt: options.notetype});

        if (options.sortBy) {
            if (options.sortBy != 'createdAt' && options.sortBy != 'updatedAt') {
                throw new createHttpError.BadRequest(`bad sortBy, get '${options.sortBy}'`);
            }
        }

        const sortBy = options.sortBy || 'id';
        query = query
            .orderBy('note.' + sortBy, options.ascending != false ? "ASC" : "DESC")
            .skip(skip);

        query = query.skip(skip);
        if (take) query = query.take(take);

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
                    .where("tagId = :tid", {tid: t.id})
                    .andWhere("noteId = :nid", {nid: note.id})
                    .execute();

                if (rs.affected == 0) throw new createHttpError.NotFound(`note doesn't contain tag '${tag}'`);

                const nremain = await tagJoinNoteRepo
                    .createQueryBuilder("rl")
                    .select()
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

    // cache
    async getNoteTagsById(noteid: number): Promise<string[]> {
        return (await this.tagRepo
            .createQueryBuilder("tag")
            .select("tag.name")
            .innerJoin(NoteJoinNoteTag, "nj", "nj.tagId = tag.id")
            .where("nj.noteId = :nid", {nid: noteid})
            .getMany()).map(t => t.name);
    }
}
