import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RESTfulAPI } from '../../restful';


export interface Note {
    title: string;
    content: string;
    contentType: string;
    generation: number;
    id: number;
    createdAt: string;
};

export interface NoteHistory {
    patch: string;
    createdAt: string;
};

type PageData<T> = { count: number ; data: T[] };
const API = RESTfulAPI.Note;
@Injectable({
    providedIn: 'root'
})
export class NoteService {
    constructor(private http: HttpClient) {}

    async getTags(): Promise<string[]> {
        return await this.http.get(API.tags).toPromise() as string[];
    }

    async getNoteTags(noteid: string): Promise<string[]> {
        return await this.http.get(API.tags, {
            params: {
                noteid,
            }
        }).toPromise() as string[];
    }

    async createNote(title: string, contentType: 'markdown' | 'todo'): Promise<number> {
        const resp = await this.http.post(API.note, {
            title: title,
            contentType: contentType,
        }).toPromise() as { noteid: number };
        return resp.noteid;
    }

    async changeTitle(noteid: number, title: string): Promise<void> {
        await this.http.put(API.title, {
            noteid, title
        }).toPromise();
    }

    async updateNote(noteid: number, patch: string): Promise<{generation: number, inconsistency: number}> {
        return await this.http.put(API.note, {
            noteid, patch
        }).toPromise() as any;
    }

    async getNoteHistory(noteid: number, skip: number, take: number): Promise<PageData<NoteHistory>> {
        return await this.http.get(API.history, {
            params: {
                noteid, skip, take
            }
        }).toPromise() as any;
    }

    async deleteNoteHistory(noteid: number, generationStart: number, generationEnd?: number): Promise<void> {
        generationEnd = generationEnd || generationStart + 1;
        await this.http.delete(API.history, {
            params: {
                noteid, generationStart, generationEnd,
            }
        }).toPromise();
    }

    async getNoteGeneratioin(noteid: number): Promise<number> {
        const ans = await this.http.put(API.generation, {
            noteid
        }).toPromise() as { generation: number};
        return ans.generation;
    }
    
    async deleteNote(noteid: number): Promise<void> {
        await this.http.delete(API.note, {
            params: {
                noteid: noteid,
            }
        }).toPromise();
    }

    async getNote(noteid: number, generation?: number): Promise<Note> {
        const params = {};
        params['noteid'] = noteid;
        if (generation != null) params['generation'] = generation;
        return await this.http.get(API.single, {
            params: params
        }).toPromise() as Note;
    }


    async getNotes(pageno: number, pagesize: number, tag?: string, notetype?: string, sortBy?: string, order?: string): Promise<PageData<Note>> {
        const params = { pageno, pagesize };
        if (tag) params['tag'] = tag;
        if (notetype) params['notetype'] = notetype;
        if (sortBy) params['sortBy'] = sortBy;
        if (order) params['order'] = order;

        return await this.http.get(API.note, {
            params: params
        }).toPromise() as PageData<Note>;
    }
}

