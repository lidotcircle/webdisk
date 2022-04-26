import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { diff_match_patch } from 'diff-match-patch';
import { Note, NoteHistory, NoteService } from 'src/app/service/note/note.service';
import { ObjectSharingService } from 'src/app/service/object-sharing.service';
import { reversePatch } from 'src/app/shared/utils';


interface NoteWithHistory extends Note {
    updatedAt: string;
    CreatedAt: string;
    UpdatedAt: string;
};

@Component({
    selector: 'app-markdown-note-history',
    template: `
    <nb-card>
        <nb-card-header>
            <div class='title'>{{ note?.title }}</div>
        </nb-card-header>
        <nb-card-body class='main-panel'>
            <div style='height: max-content;'
                infiniteScroll 
                [infiniteScrollDistance]="2"
                [infiniteScrollThrottle]="50"
                [immediateCheck]='false'
                [infiniteScrollContainer]="'.main-panel'"
                [fromRoot]='true'
                (scrolled)='handleScroll($event)'>
                <div *ngFor='let item of items' [class]='"type-" + item.type'>
                    <div *ngIf='item.type == "note"' class='note-item'>
                        <div class='note-tools'>
                            <div class='note-time'>{{ item.data.UpdatedAt }}</div>
                            <div></div><div></div><div></div>
                            <div></div><div></div><div></div>
                            <button nbButton size='small' status='primary'>use</button>
                            <button nbButton size='small' status='primary'>delete</button>
                        </div>
                        <app-note-preview [note]='item.data'></app-note-preview>
                    </div>
                    <div *ngIf='item.type == "day-separator"' class='day-separator'>
                        <div class='date-leader'></div>
                        <div class='date-value'> {{ item.data }} </div>
                    </div>
                    <div *ngIf='item.type == "end"' class='history-end'>
                        This is start point
                    </div>
                </div>
            </div>
        </nb-card-body>
    </nb-card>
    `,
    styleUrls: ["./markdown-note-history.component.scss"],
    styles: []
})
export class MarkdownNoteHistoryComponent implements OnInit {
    noteHistoryCount: number;
    items: { type: string, data: NoteWithHistory | any}[];
    note: Note;
    private notes: NoteWithHistory[];
    private eachTimeGet: number = 10;

    constructor(private toastr: NbToastrService,
                private router: Router,
                private noteService: NoteService,
                private sharing: ObjectSharingService,
                private activatedRoute: ActivatedRoute)
    {
        this.notes = [];
        this.items = [];
    }

    ngOnInit(): void {
        this.activatedRoute.queryParamMap.subscribe(async (params) => {
            const key = params.get("noteref");
            const noteid = params.get("noteid");
            if (key) {
                this.note = this.sharing.loadClear(Number(key));
            } 

            if (!this.note && noteid == null) {
                this.toastr.danger("page error", "Note");
                return;
            }

            if (!this.note){
                try {
                    this.note = await this.noteService.getNote(Number(noteid));
                } catch {
                    this.toastr.danger("get note failed", "Note");
                    return;
                }
            }

            this.notes.push(this.note as any);
            try {
                const his = await this.noteService.getNoteHistory(this.note.id, 0, this.eachTimeGet + 1);
                this.noteHistoryCount = his.count;
                this.appendHistory(his.data);
            } catch (e) {
                console.error(e);
                this.toastr.danger("failed to get history", "Note");
            }
        });
    }

    private lastUpdateDate: Date;
    private insertDaySeparator(currentUpdateDate: Date | string) {
        if (typeof currentUpdateDate == 'string') {
            currentUpdateDate = new Date(currentUpdateDate);
        }

        const isSameDay = (d1: Date, d2: Date) => (
            d1.getFullYear() == d2.getFullYear() &&
            d1.getMonth() == d2.getMonth() &&
            d1.getDay() == d2.getDay()
        );

        if (this.lastUpdateDate == null || !isSameDay(this.lastUpdateDate, currentUpdateDate)) {
            this.lastUpdateDate = currentUpdateDate;
            this.items.push({
                type: 'day-separator',
                data: currentUpdateDate.toLocaleDateString(),
            });
        }
    }

    private appendHistory(histories: NoteHistory[]) {
        const dmp = new diff_match_patch();
        for (const history of histories) {
            const last = this.notes[this.notes.length - 1];
            last.updatedAt = history.createdAt;
            this.updateDate(last);
            this.insertDaySeparator(last.updatedAt);
            this.items.push({ type: 'note', data: last});

            const patch = reversePatch(dmp.patch_fromText(history.patch));
            const [ old, incons ]= dmp.patch_apply(patch, last.content);
            const old_note: NoteWithHistory = {} as any;
            const success = incons.reduce((a, b) => a && b);
            if (!success) {
                this.toastr.warning("data inconsistency", "Note");
            }

            old_note.id = last.id;
            old_note.title = last.title;
            old_note.generation = last.generation - 1;
            old_note.contentType = last.contentType;
            old_note.createdAt = last.createdAt;
            old_note.content = old;
            this.notes.push(old_note);
        }

        if (this.notes.length == (this.noteHistoryCount + 1)) {
            const last = this.notes[this.notes.length - 1];
            last.updatedAt = last.createdAt;
            this.updateDate(last);
            this.insertDaySeparator(last.updatedAt);
            this.items.push({ type: 'note', data: last});
            this.items.push({ type: 'end', data: null});
        }
    }

    private updateDate(note: NoteWithHistory) {
        const created = new Date(note.createdAt);
        note.CreatedAt = created.toLocaleTimeString();

        const updated = new Date(note.updatedAt);
        note.UpdatedAt = updated.toLocaleTimeString();
    }

    async handleScroll(_event: any) {
        if (this.notes.length > this.noteHistoryCount) return;
        const his = await this.noteService.getNoteHistory(this.note.id, this.notes.length - 1, this.eachTimeGet);
        this.appendHistory(his.data);
    }
}
