import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbThemeService, NbToastrService } from '@nebular/theme';
import { interval, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Note, NoteService } from 'src/app/service/note/note.service';
import { ObjectSharingService } from 'src/app/service/object-sharing.service';
import { MessageBoxService } from 'src/app/shared/service/message-box.service';
import { downloadURI, nbThemeIsDark } from 'src/app/shared/utils';
import html2canvas from 'html2canvas';


@Component({
    selector: 'app-markdown-viewer',
    template: `
    <nb-card>
        <nb-card-header>
            <div class='title'>{{ note?.title }}</div>
            <div class='info'>
                <span>CreatedAt: {{ createdAt }}</span>
                <span>UpdatedAt: {{ updatedAt }}</span>
            </div>
            <app-tag-list class='tags' [tags]='note?.tags || []'></app-tag-list>
        </nb-card-header>
        <nb-card-body>
            <app-tui-viewer [theme]='theme' [initialValue]='note?.content'></app-tui-viewer>
        </nb-card-body>
        <nb-card-footer>
            <button status='primary' size='small' nbButton (click)='gotoEditor()'>edit</button>
            <button status='primary' size='small' nbButton [disabled]='inScreenshoting' (click)='saveAsImage()'>screenshot</button>
            <button status='primary' size='small' nbButton (click)='gotoHistory()'>history</button>
            <button status='danger'  size='small' nbButton (click)='deleteNote()'>delete</button>
        </nb-card-footer>
    </nb-card>
    `,
    styleUrls: ["./markdown-viewer.component.scss"],
    styles: []
})
export class MarkdownViewerComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject();
    private generation: number;

    note: Note;
    theme: string;
    get createdAt() {
        if (!this.note) {
            return "";
        }
        return new Date(this.note.createdAt).toLocaleString();
    }

    get updatedAt() {
        if (!this.note) {
            return "";
        }
        return new Date(this.note.updatedAt).toLocaleString();
    }

    constructor(private toastr: NbToastrService,
                private msgBox: MessageBoxService,
                private router: Router,
                private noteService: NoteService,
                private sharing: ObjectSharingService,
                private nbthemeService: NbThemeService,
                private host: ElementRef,
                private activatedRoute: ActivatedRoute)
    {
        this.theme = nbThemeIsDark(this.nbthemeService.currentTheme) ? 'dark' : 'light';
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }


    ngOnInit(): void {
        this.activatedRoute.queryParamMap.subscribe(async (params) => {
            const key = params.get("noteref");
            const generation = params.get("generation");
            const noteid = params.get("noteid");
            if (key) {
                this.note = this.sharing.loadClear(Number(key));
            } 
            if (generation != null) {
                this.generation = Number(generation);
            } else {
                this.generation = null;
            }

            if (!this.note && noteid == null) {
                this.toastr.danger("page error", "Note");
                return;
            }

            if (this.note && this.generation == null) {
                const gen = await this.noteService.getNoteGeneratioin(this.note.id);
                if (gen != this.note.generation) {
                    // TODO using patch ?
                    this.note = null;
                }
            }

            if (!this.note) {
                await this.refresh(Number(noteid));
            }
        });

        let doit = false;
        interval(5000)
            .pipe(takeUntil(this.destroy$), filter(() => this.note != null && !doit && this.generation == null))
            .subscribe(async () => {
                doit = true;
                try {
                    const gen = await this.noteService.getNoteGeneratioin(this.note.id);
                    if (gen != this.note.generation)
                        await this.refresh(this.note.id);
                    doit = false;
                } catch {}
            });
    }

    async refresh(noteid: number) {
        try {
            this.note = await this.noteService.getNote(Number(noteid), this.generation);
        } catch {
            this.toastr.danger("page error", "Note");
        }
    }

    async gotoEditor() {
        if (!this.note) {
            this.toastr.danger("bad note", "Note");
        }

        this.router.navigate(["../markdown-editor"], {
            queryParams: {
                noteid: this.note.id,
            },
            relativeTo: this.activatedRoute,
        });
    }

    async gotoHistory() {
        if (!this.note) {
            this.toastr.danger("bad note", "Note");
        }

        this.router.navigate(["../markdown-note-history"], {
            queryParams: {
                noteid: this.note.id,
            },
            relativeTo: this.activatedRoute,
        });
    }

    async deleteNote() {
        if (await this.msgBox.confirmMSG("Are you sure to delete this note?", "Note")) {
            try {
                await this.noteService.deleteNote(this.note.id);
                this.toastr.success("note deleted", "Note");
                this.router.navigate(["../timeline"], {
                    relativeTo: this.activatedRoute
                });
            } catch {
                this.toastr.danger("note delete failed", "Note");
            }
        }
    }

    inScreenshoting = false;
    async saveAsImage() {
        this.inScreenshoting = true;
        try {
            const host = this.host.nativeElement as HTMLElement;
            const viewer = host.querySelector('app-tui-viewer') as HTMLElement;
            const canvas = await html2canvas(viewer);
            const imgData = canvas.toDataURL('image/png');
            downloadURI(imgData, `${this.note.title}.png`);
        } finally {
            this.inScreenshoting = false;
        }
    }
}
