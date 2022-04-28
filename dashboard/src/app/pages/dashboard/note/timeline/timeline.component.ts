import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NbToastrService } from '@nebular/theme';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Note, NoteService } from 'src/app/service/note/note.service';
import { AsyncLocalStorageService } from 'src/app/shared/service/async-local-storage.service';
import { MessageBoxService } from 'src/app/shared/service/message-box.service';
import onChange from 'on-change';
import { saveDataAsFile } from 'src/app/shared/utils';


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
    selector: 'app-timeline',
    template: `
    <nb-card>
        <nb-card-header>
            <nb-radio-group [(ngModel)]="config.typeFilter" class='type-filter'>
                <nb-radio value="all">All</nb-radio>
                <nb-radio value="markdown">Markdown</nb-radio>
                <nb-radio value="todo">Todo</nb-radio>
            </nb-radio-group>
            <nb-checkbox [(ngModel)]='config.sortByModifiedTime'>Sort By Modified Time</nb-checkbox>
            <nb-checkbox [(ngModel)]='config.ascending'>Ascending</nb-checkbox>
            <div class='total'>{{ numberOfNotes }}</div>
            <button nbButton size='large' status='primary' ghost (click)='createNote($event)'><nb-icon icon='plus-square'></nb-icon></button>
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
    styleUrls: ["./timeline.component.scss"],
    styles: []
})
export class TimelineComponent implements OnInit, OnDestroy {
    numberOfNotes: number;
    items: ItemType[];
    config: PageConfig;
    private notes: Note[];
    private destroy$: Subject<void>;

    @ViewChild("scrolledElement", {static: true})
    private scrolledElement: ElementRef;


    constructor(private msgbox: MessageBoxService,
                private toastr: NbToastrService,
                private noteService: NoteService,
                private localstorage: AsyncLocalStorageService,
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
        const newobj = Object.assign({}, this.config);
        await this.localstorage.set("timeline-config", newobj);
    }

    private async restoreConfig() {
        const config = await this.localstorage.get<PageConfig>("timeline-config");
        if (config) {
            this.config = this.watchConfig(config);
        }
        await this.refresh();
    }

    ngOnInit(): void {
        this.restoreConfig();

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

    async refresh() {
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
            pageno, pagesize, null, 
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

    onDownloadClick(n: number) {
        const item = this.items[n];
        if (!item || item.type != "note") return;
        const note: Note = item.data;

        saveDataAsFile(note.content,
                       `${note.title}-${(new Date(note.updatedAt).toLocaleString())}.md`);
    }


    async createNote(_event: any) {
        const rs = await this.msgbox.create({
            title: "create new note",
            message: "create new note with title and note type",
            inputs: [
                { name: "title", label: "title" },
                { name: "type", label: "note type", initValue: "markdown" },
            ],
            buttons: [
                { name: "confirm" },
                { name: "cancel" },
            ],
        }).wait();

        if (rs.closed) return;

        if (rs.buttonValue == 0) {
            const title = rs.inputs['title'];
            const notetype = rs.inputs['type'];
            if (!title || title == '') {
                this.toastr.danger("bad title", "Note");
                return;
            }

            if (notetype != 'markdown' && notetype != 'todo') {
                this.toastr.danger("bad note type", "Note");
                return;
            }

            try {
                await this.noteService.createNote(rs.inputs['title'], rs.inputs['type'] as any);
                this.toastr.info(`create note success`, "Note");
                await this.refresh();
            } catch {
                this.toastr.danger("create note failed", "Note");
            }
        }
    }
}
