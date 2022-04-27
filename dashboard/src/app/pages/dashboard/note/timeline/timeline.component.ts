import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbToastrService } from '@nebular/theme';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Note, NoteService } from 'src/app/service/note/note.service';
import { AsyncLocalStorageService } from 'src/app/shared/service/async-local-storage.service';
import { MessageBoxService } from 'src/app/shared/service/message-box.service';
import onChange from 'on-change';


interface PageConfig {
    typeFilter: string;
    sortByModifiedTime: boolean;
    ascending: boolean;
};

@Component({
    selector: 'app-timeline',
    template: `
    <nb-card>
        <nb-card-header>
            <button nbButton (click)='createNote($event)'>Create</button>
            <nb-radio-group [(ngModel)]="config.typeFilter" class='type-filter'>
                <nb-radio value="all">All</nb-radio>
                <nb-radio value="markdown">Markdown</nb-radio>
                <nb-radio value="todo">Todo</nb-radio>
            </nb-radio-group>
            <nb-checkbox [(ngModel)]='config.sortByModifiedTime'>Sort By Modified Time</nb-checkbox>
            <nb-checkbox [(ngModel)]='config.ascending'>Ascending</nb-checkbox>
        </nb-card-header>
        <nb-card-body>
            <app-note-preview *ngFor="let note of notes" [note]='note'></app-note-preview>
        </nb-card-body>
    </nb-card>
    `,
    styleUrls: ["./timeline.component.scss"],
    styles: []
})
export class TimelineComponent implements OnInit, OnDestroy {
    numberOfNotes: number;
    notes: Note[];
    config: PageConfig;
    private destroy$: Subject<void>;

    constructor(private msgbox: MessageBoxService,
                private toastr: NbToastrService,
                private noteService: NoteService,
                private localstorage: AsyncLocalStorageService)
    {
        const config: PageConfig = {} as any;
        config.typeFilter = 'all';
        this.config = this.watchConfig(config);

        this.destroy$ = new Subject();
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
    }

    async refresh() {
        try {
            const notes = await this.noteService.getNotes(
                1, 5, null, 
                this.config.typeFilter, 
                this.config.sortByModifiedTime ? 'updatedAt' : 'createdAt', 
                this.config.ascending ? 'ASC' : 'DESC'
            );
            this.numberOfNotes = notes.count;
            this.notes = notes.data;
        } catch {
            this.toastr.danger("get notes failed", "Note");
        }
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
            } catch {
                this.toastr.danger("create note failed", "Note");
            }
        }
    }
}
