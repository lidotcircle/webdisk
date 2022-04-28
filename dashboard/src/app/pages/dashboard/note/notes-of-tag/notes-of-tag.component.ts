import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NbToastrService } from '@nebular/theme';
import { interval, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Note, NoteService } from 'src/app/service/note/note.service';
import { AsyncLocalStorageService } from 'src/app/shared/service/async-local-storage.service';
import onChange from 'on-change';
import { saveDataAsFile } from 'src/app/shared/utils';
import { ActivatedRoute, Router } from '@angular/router';


interface PageConfig {
    typeFilter: string;
    sortByModifiedTime: boolean;
    ascending: boolean;
};

interface ItemType {
    type: string; 
    data: Note | any;
    hidden?: boolean;
};

@Component({
    selector: 'app-notes-of-tag',
    template: `
    <nb-card>
        <nb-card-header>
            <div class='total'><nb-icon icon='star'></nb-icon><span class='tag'>{{ tag }}</span> {{ numberOfNotes }}</div>
            <nb-radio-group [(ngModel)]="config.typeFilter" class='type-filter'>
                <nb-radio value="all">All</nb-radio>
                <nb-radio value="markdown">Markdown</nb-radio>
                <nb-radio value="todo">Todo</nb-radio>
            </nb-radio-group>
            <nb-checkbox [(ngModel)]='config.sortByModifiedTime'>Sort By Modified Time</nb-checkbox>
            <nb-checkbox [(ngModel)]='config.ascending'>Ascending</nb-checkbox>
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
                    <div *ngIf='item.type == "note"' class='note-item'>
                        <div class='note-tools'>
                            <div class='note-time'>{{ item.data.Time }}</div>
                            <div class='tags-wrapper'>
                                <app-tag-list class='tags' [tags]='item.data.tags'></app-tag-list>
                            </div>
                            <div class='take-space'></div>
                            <div class='buttons'>
                                <button nbButton ghost [disabled]='onWorking' status='primary' (click)='gotoEditor(i)'>
                                    <nb-icon icon='edit'></nb-icon>
                                </button>
                                <button nbButton ghost [disabled]='onWorking' status='primary' (click)='onDownloadClick(i)'>
                                    <nb-icon icon='download'></nb-icon>
                                </button>
                            </div>
                        </div>
                        <app-note-preview [generation]='false' [note]='item.data'></app-note-preview>
                    </div>
                    <div *ngIf='item.type == "day-separator"' [class]='"day-separator " + (item.data.folded ? "closed" : "open")'>
                        <div class='date-value'> {{ item.data.dateStr }} </div>
                        <a class='date-leader-ox' (click)='onDoubleClick(i)'><div class='date-leader'></div></a>
                    </div>
                    <div *ngIf='item.type == "end"' class='history-end'>End</div>
                </div>
            </div>
        </nb-card-body>
    </nb-card>
    `,
    styleUrls: ["./notes-of-tag.component.scss"],
})
export class NotesOfTagComponent implements OnInit, OnDestroy {
    tag: string;
    numberOfNotes: number;
    items: ItemType[];
    config: PageConfig;
    private notes: Note[];
    private destroy$: Subject<void>;

    @ViewChild("scrolledElement", {static: true})
    private scrolledElement: ElementRef;


    constructor(private toastr: NbToastrService,
                private noteService: NoteService,
                private localstorage: AsyncLocalStorageService,
                private router: Router,
                private activatedRoute: ActivatedRoute,
                private host: ElementRef)
    {
        const config: PageConfig = {} as any;
        config.typeFilter = 'all';
        this.config = this.watchConfig(config);

        this.destroy$ = new Subject();
        this.notes = [];
        this.items = [];
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private watchConfig(config: PageConfig): PageConfig {
        return onChange(config, async () => {
            await this.saveConfig();
            await this.refresh();
        }, {
            isShallow: true,
        });
    }

    private async saveConfig() {
        if (!this.tag) return;
        const newobj = Object.assign({}, this.config);
        await this.localstorage.set(`notes-of-tag-${this.tag}-config`, newobj);
    }

    private async restoreConfig() {
        const config = await this.localstorage.get<PageConfig>(`notes-of-tag-${this.tag}-config`);
        if (config) {
            this.config = this.watchConfig(config);
        }
        await this.refresh();
    }

    ngOnInit(): void {
        this.activatedRoute.queryParamMap.subscribe(async (params) => {
            this.tag = params.get("tag");
            if (this.tag == null) {
                console.warn("bad page, what??");
                this.toastr.danger("bad page", "Note");
            } else {
                await this.restoreConfig();
            }
        });

        const host = this.host.nativeElement as HTMLElement;
        const panel = host.querySelector(".main-panel") as HTMLElement;
        const scroll = this.scrolledElement.nativeElement as HTMLElement;
        interval(1000)
            .pipe(takeUntil(this.destroy$), filter(() => this.tag != null))
            .subscribe(async () => {
                if (scroll.clientHeight < panel.clientHeight) {
                    await this.handleScroll(null)
                }
            });
    }

    async refresh() {
        if (this.tag == null) return;

        this.notes = [];
        this.items = [];
        this.prevSeparator = null;
        try {
            const notes = await this.getNote(1, 5);
            this.numberOfNotes = notes.count;
            notes.data.forEach(v => this.appendNote(v));
        } catch {
            this.toastr.danger("get notes failed", "Note");
        }
    }

    private async getNote(pageno: number, pagesize: number) {
        return await this.noteService.getNotes(
            pageno, pagesize, this.tag, 
            this.config.typeFilter, 
            this.config.sortByModifiedTime ? 'updatedAt' : 'createdAt', 
            this.config.ascending ? 'ASC' : 'DESC'
        );
    }

    private async fetchNote() {
        if (this.notes.length >= this.numberOfNotes) return;

        try {
            const pagesize = 5;
            const pageno = this.notes.length / pagesize + 1
            const { data, count } = await this.getNote(pageno, pagesize);
            if (count != this.numberOfNotes) {
                await this.refresh();
                return;
            } else {
                data.forEach(v => this.appendNote(v));
            }
        } catch {
            this.toastr.danger("get notes failed", "Note");
        }
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

    private appendNote(note: Note) {
        this.notes.push(note);
        const notedate = (this.config.sortByModifiedTime ? 
                          new Date(note.updatedAt) : 
                          new Date(note.createdAt));
        this.insertDaySeparator(notedate);
        (note as any).Time = notedate.toLocaleTimeString();
        this.items.push({
            type: 'note',
            data: note,
            hidden: this.prevSeparator.data.folded,
        });

        if (this.notes.length == this.numberOfNotes) {
            this.items.push({
                type: 'end',
                data: null,
            });
        }
    }

    async handleScroll(_event: any) {
        await this.fetchNote();
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

    async gotoEditor(n: number) {
        const item = this.items[n];
        if (!item || item.type != "note") return;
        const note: Note = item.data;

        this.router.navigate(["../markdown-editor"], {
            queryParams: {
                noteid: note.id,
            },
            relativeTo: this.activatedRoute,
        });
    }

    onDownloadClick(n: number) {
        const item = this.items[n];
        if (!item || item.type != "note") return;
        const note: Note = item.data;

        saveDataAsFile(note.content,
                       `${note.title}-${(new Date(note.updatedAt).toLocaleString())}.md`);
    }
}
