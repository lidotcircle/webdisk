import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { diff_match_patch } from 'diff-match-patch';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Note, NoteHistory, NoteService } from 'src/app/service/note/note.service';
import { ObjectSharingService } from 'src/app/service/object-sharing.service';
import { MessageBoxService } from 'src/app/shared/service/message-box.service';
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
            <div class='info'>
                <span>Versions: {{ noteHistoryCount }}</span>
                <span>CreatedAt: {{ createdAt }}</span>
                <span>UpdatedAt: {{ updatedAt }}</span>
            </div>
        </nb-card-header>
        <nb-card-body class='main-panel'>
            <div style='height: max-content;'
                infiniteScroll 
                [infiniteScrollDistance]="2"
                [infiniteScrollThrottle]="50"
                [immediateCheck]='false'
                [infiniteScrollContainer]="'.main-panel'"
                [fromRoot]='true'
                (scrolled)='handleScroll($event)' #scrolledElement>
                <div *ngFor='let item of items; let i = index' [class]='"type-" + item.type + (item.hidden ? " item-hidden" : "")'>
                    <div *ngIf='item.type == "note" && item.data.generation > 0' class='note-item'>
                        <div class='note-tools'>
                            <div class='note-time'>{{ item.data.UpdatedAt }}</div>
                            <div></div><div></div><div></div>
                            <div></div><div></div><div></div>
                            <button nbButton [disabled]='onWorking' size='small' status='primary' (click)='onUseClick(i)'>use</button>
                            <button nbButton [disabled]='onWorking' size='small' status='primary' (click)='onDeleteClick(i)'>delete</button>
                        </div>
                        <app-note-preview [note]='item.data'></app-note-preview>
                    </div>
                    <div *ngIf='item.type == "day-separator"' [class]='"day-separator " + (item.data.folded ? "closed" : "open")'>
                        <div class='date-value'> {{ item.data.dateStr }} </div>
                        <div class='date-leader-ox' (click)='onDoubleClick(i)'><div class='date-leader'></div></div>
                        <button nbButton [disabled]='onWorking' size='small' status='primary' (click)='onMergeClick(i)'>merge</button>
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
export class MarkdownNoteHistoryComponent implements OnInit, OnDestroy {
    noteHistoryCount: number;
    createdAt: string;
    updatedAt: string;
    items: { type: string, data: NoteWithHistory | any, hidden?: boolean }[];
    note: Note;
    private notes: NoteWithHistory[];
    private eachTimeGet: number = 10;
    private histories: NoteHistory[];
    private destroy$: Subject<void>;

    @ViewChild("scrolledElement", {static: true})
    private scrolledElement: ElementRef;

    constructor(private toastr: NbToastrService,
                private noteService: NoteService,
                private msgBox: MessageBoxService,
                private sharing: ObjectSharingService,
                private activatedRoute: ActivatedRoute,
                private host: ElementRef)
    {
        this.notes = [];
        this.items = [];
        this.histories = [];
        this.destroy$ = new Subject();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
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

            this.createdAt = (new Date(this.note.createdAt)).toLocaleString();
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

        const host = this.host.nativeElement as HTMLElement;
        const panel = host.querySelector(".main-panel") as HTMLElement;
        const scroll = this.scrolledElement.nativeElement as HTMLElement;
        interval(1000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(async () => {
                if (scroll.clientHeight < panel.clientHeight) {
                    await this.handleScroll(null)
                }
            });
    }

    private prevSeparator: { data: { folded: boolean, date: Date, [key: string]: any }, [key: string]: any };
    private insertDaySeparator(currentUpdateDate: Date | string) {
        if (typeof currentUpdateDate == 'string') {
            currentUpdateDate = new Date(currentUpdateDate);
        }

        const isSameDay = (d1: Date, d2: Date) => (
            d1.getFullYear() == d2.getFullYear() &&
            d1.getMonth() == d2.getMonth() &&
            d1.getDate() == d2.getDate()
        );

        if (this.prevSeparator == null || !isSameDay(this.prevSeparator.data.date, currentUpdateDate)) {
            this.prevSeparator = {
                type: 'day-separator',
                data: {
                    dateStr: currentUpdateDate.toLocaleDateString(),
                    date: currentUpdateDate,
                    folded: false,
                },
            };
            this.items.push(this.prevSeparator as any);
        }
    }

    private appendHistory(histories: NoteHistory[]) {
        if (histories.length == 0) return;

        histories.forEach(v => this.histories.push(v));
        const lastupdate = this.histories[0];
        this.updatedAt = (new Date(lastupdate.createdAt)).toLocaleString();

        const dmp = new diff_match_patch();
        for (const history of histories) {
            const last = this.notes[this.notes.length - 1];
            last.updatedAt = history.createdAt;
            this.updateDate(last);
            this.insertDaySeparator(last.updatedAt);
            this.items.push({ type: 'note', data: last, hidden: this.prevSeparator.data.folded});

            const patch = reversePatch(dmp.patch_fromText(history.patch));
            const [ old, incons ]= dmp.patch_apply(patch, last.content);
            const old_note: NoteWithHistory = {} as any;
            const success = incons.length == 0 || incons.reduce((a, b) => a && b);
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
            this.items.push({ type: 'note', data: last, hidden: this.prevSeparator.data.folded});
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

    useClickIndex: number;
    async onUseClick(n: number) {
        try {
            this.useClickIndex = n;
            await this.onUseClickTrue(n);
        } finally {
            this.useClickIndex = null;
        }
    }

    private async onUseClickTrue(n: number) {
        const item = this.items[n];
        if (!item || item.type != "note") return;

        const dmp = new diff_match_patch();
        const note: Note = item.data;
        if (this.note.content == note.content) {
            this.toastr.info("already update-to-date", "Note");
            return;
        }

        const patchText = dmp.patch_toText(dmp.patch_make(this.note.content, note.content));
        try {
            const resp = await this.noteService.updateNote(this.note.id, patchText);
            if (resp.generation != this.note.generation + 1) {
                this.toastr.warning("inconsistent data, reload page", "Note");
                setTimeout(() => window.location.reload(), 3000);
            }
        } catch {
            this.toastr.danger("Use history content failed", "Note");
            return;
        }

        this.note.content = note.content;
        this.note.generation++;
        const newHis: NoteHistory = {} as any;
        newHis.patch = patchText;
        newHis.createdAt = (new Date()).toISOString();
        this.histories.splice(0, 0, newHis);

        const h = this.histories;
        this.notes = [ this.note as any ];
        this.items = [];
        this.histories = [];
        this.prevSeparator = null;
        this.noteHistoryCount++;
        this.appendHistory(h);
        this.toastr.info("update success", "Note");
    }

    deleteClickIndex: number;
    async onDeleteClick(n: number) {
        try {
            this.deleteClickIndex = n;
            await this.onDeleteClickTrue(n);
        } finally {
            this.deleteClickIndex = null;
        }
    }

    private async onDeleteClickTrue(n: number) {
        const item = this.items[n];
        if (!item || item.type != "note") return;
        const note: Note = item.data;

        const isLast = note.generation == this.note.generation;
        if (isLast) {
            if (!(await this.msgBox.confirmMSG("This operation will cause current status change, confirm?"))) {
                return;
            }
        } else if (note.generation == 0) {
            this.toastr.danger("impossible", "Note");
            return;
        }

        try {
            await this.noteService.deleteNoteHistory(note.id, note.generation);
        } catch {
            this.toastr.danger("delete history failed", "Note");
            return;
        }

        const notes = this.items.filter(item => item.type == 'note').map(item => item.data as Note);
        if (isLast) {
            console.assert(notes.length > 1);
            this.note.content = notes[1].content;
            this.histories.splice(0, 1);
        } else {
            const dmp = new diff_match_patch();
            const mt = notes.find(v => v.generation == note.generation + 1);
            let oldc = '';
            if (note.generation > 1) {
                const c = notes.find(v => v.generation == note.generation - 1);
                oldc = c.content;
            }
            const newPatchText = dmp.patch_toText(dmp.patch_make(oldc, mt.content));
            const idx = notes.indexOf(note);
            this.histories.splice(idx, 1);
            this.histories[idx].patch = newPatchText;
        }
        this.note.generation--;
        this.noteHistoryCount--;

        const his = this.histories;
        this.histories = [];
        this.notes = [ this.note as any ];
        this.items = [];
        this.prevSeparator = null;
        this.appendHistory(his);
    }

    mergeClickIndex: number;
    async onMergeClick(n: number) {
        try {
            this.mergeClickIndex = n;
            await this.onMergeClickTrue(n);
        } finally {
            this.mergeClickIndex = null;
        }
    }

    private async onMergeClickTrue(n: number) {
        const item = this.items[n];
        if (!item || item.type != "day-separator") return;
        const theday: Date = item.data.date;
        const daybegin = new Date(theday.getFullYear(), theday.getMonth(), theday.getDate(), 0, 0, 0, 0);
        const dayend = new Date(daybegin.getTime() + 24 * 60 * 60 * 1000);

        const notes = this.items.filter(item => item.type == 'note').map(item => item.data as NoteWithHistory);
        const gn = notes.findIndex(v => {
            const updatedAt = new Date(v.updatedAt);
            return (daybegin.getTime() <= updatedAt.getTime() &&
                    updatedAt.getTime() < dayend.getTime());
        });
        const mtnote = notes[gn];
        const generationEnd = mtnote.generation;
        let generationStart = 1;
        for (let i=gn+1;i<notes.length;i++) {
            const n = notes[i];
            const updatedAt = new Date(n.updatedAt);
            if (updatedAt.getTime() < daybegin.getTime()) {
                generationStart = n.generation + 1;
                break;
            }
        }

        if (generationStart == generationEnd) {
            this.toastr.info("merge nothing", "Note");
            return;
        }

        try {
            await this.noteService.deleteNoteHistory(this.note.id, generationStart, generationEnd);
        } catch {
            this.toastr.danger("merge history failed", "Note");
            return;
        }

        const dmp = new diff_match_patch();
        const ntnote = notes.find(v => v.generation == generationStart - 1);
        const newPatchText = dmp.patch_toText(dmp.patch_make(ntnote.content, mtnote.content));
        this.histories[gn].patch = newPatchText;
        const deleteCount = generationEnd - generationStart;
        this.histories.splice(gn + 1, deleteCount);

        this.note.generation -= deleteCount;
        this.noteHistoryCount -= deleteCount;

        const his = this.histories;
        this.histories = [];
        this.notes = [ this.note as any ];
        this.items = [];
        this.prevSeparator = null;
        this.appendHistory(his);
    }

    async onDoubleClick(n: number) {
        const item = this.items[n];
        if (!item || item.type != "day-separator") return;

        const data = item.data;
        data.folded = !data.folded;
        for (let i=n+1;i<this.items.length;i++) {
            const item = this.items[i];
            if (item.type != "note") break;
            item.hidden = data.folded;
        }
    }

    get onWorking(): boolean {
        return (this.useClickIndex != null || 
                this.deleteClickIndex != null || 
                this.mergeClickIndex != null);
    }
}
