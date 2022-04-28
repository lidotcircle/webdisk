import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NbThemeService, NbToastrService } from '@nebular/theme';
import { Note, NoteService } from 'src/app/service/note/note.service';
import { ObjectSharingService } from 'src/app/service/object-sharing.service';
import { TuiEditorComponent } from 'src/app/shared/shared-component/toast-ui/tui-editor/tui-editor.component';
import { diff_match_patch } from 'diff-match-patch';
import { interval, Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import hotkeys from 'hotkeys-js';
import { nbThemeIsDark, saveDataAsFile } from 'src/app/shared/utils';
import { FrontendSettingService } from 'src/app/service/user/frontend-setting.service';


@Component({
    selector: 'app-markdown-editor',
    template: `
    <nb-card>
        <nb-card-header>
            <div class='header'>
                <a *ngIf='showTitle'  class='title' (click)='onToggleTitleClick()'>{{ note?.title }}</a>
                <input class='info-input' matInput *ngIf='!showTitle' [disabled]='!note' [(ngModel)]='inputTitle' (blur)='onTitleBlur()' #titleinput>
                <div class='savingStatus how-many-be-modified' *ngIf='howManyBeModified>0'>Patch Length: <span class='bd'>{{ howManyBeModified }}</span></div>
                <div class='savingStatus' *ngIf='!lastSaveTime'>Not Saved</div>
                <div class='savingStatus' *ngIf='lastSaveTime'>
                     Last Saved: <span class='bd savetime'>{{ lastSaveTime }}</span>
                     <span class='bd'>{{ lastSaveElapsedMin }}</span> minutes ago
                 </div>
            </div>
            <app-tag-list class='tags' [addButton]='true' [deleteButton]='true' [tags]='note?.tags || []'
                          (deleteTag)='onDeleteTagClick($event)'
                          (addTag)='onAddTagClick($event)'></app-tag-list>
        </nb-card-header>
        <nb-card-body>
            <app-tui-editor height="100%" [initialValue]='note?.content' [theme]='theme'
                (blur)='handleBlur($event)' (change)='handleChange($event)'#editor
                (keydown)='handleKeydown($event)'>
            </app-tui-editor>
        </nb-card-body>
        <nb-card-footer *ngIf='showButtons'>
            <button nbButton size='small' status='primary' [disabled]='!note || insaving' (click)='handleSaveClick($event)'>Save</button>
            <button nbButton size='small' status='primary' [disabled]='!note' (click)='downloadMarkdown()'>Download</button>
        </nb-card-footer>
    </nb-card>
    `,
    styleUrls: ["./markdown-editor.component.scss"],
    styles: []
})
export class MarkdownEditorComponent implements OnInit, OnDestroy {
    note: Note;
    lastSaveTime: string;
    lastSaveElapsedMin: number;
    showTitle: boolean = true;
    inputTitle: string;
    theme: string = 'dark';
    howManyBeModified: number;

    @ViewChild("editor", { static: true})
    private editorComponentRef: TuiEditorComponent;
    @ViewChild("titleinput")
    private titleInputRef: ElementRef;

    private get editor() { return this.editorComponentRef.editor; }
    private destroy$: Subject<void>;

    showButtons: boolean;
    savingInterval: number;
    constructor(private toastr: NbToastrService,
                private noteService: NoteService,
                private sharing: ObjectSharingService,
                private activatedRoute: ActivatedRoute,
                private settings: FrontendSettingService,
                private nbtheme: NbThemeService)
    {
        this.theme = nbThemeIsDark(this.nbtheme.currentTheme) ? 'dark' : 'light';
        this.destroy$ = new Subject();
        this.showButtons = this.settings.Note_Editor_ShowButtons;
        this.savingInterval = this.settings.Note_Editor_SavingInterval;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();

        hotkeys.deleteScope("md-editor");
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
                this.note = await this.noteService.getNote(Number(noteid));
            }
        });

        interval(1000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                if (!this.lastSavingDate) return;
                const now = new Date();
                this.lastSaveElapsedMin = Math.floor((now.getTime() - this.lastSavingDate.getTime()) / (1000 * 60));
                this.lastSaveTime = this.lastSavingDate.toLocaleTimeString();
            });

        if (this.settings.Note_Editor_ShowPatchLength) {
            interval(3000)
                .pipe(takeUntil(this.destroy$))
                .subscribe(() => this.howManyBeModified = this.patchLength());
        }

        const inter = Math.max(5 * 60 * 1000, this.savingInterval);
        interval(inter)
            .pipe(takeUntil(this.destroy$))
            .subscribe(async () => await this.doUpdate());

        hotkeys.setScope("md-editor");
        hotkeys("ctrl+m,ctrl+s", "md-editor", (event, _handler) => {
            event.stopPropagation();
            event.preventDefault();
            this.doUpdate();
        });
        hotkeys("ctrl+y,ctrl+d", "md-editor", (event, _handler) => {
            event.stopPropagation();
            event.preventDefault();
            this.downloadMarkdown();
        });
    }

    @HostListener("document:keydown.control.a", ["$event"])
    onCtrlA(event: KeyboardEvent) {
        event.stopPropagation();
        event.preventDefault();
        if (this.editor) {
            this.editor.moveCursorToStart();
        }
    }

    @HostListener("document:keydown.control.e", ["$event"])
    onCtrlE(event: KeyboardEvent) {
        event.stopPropagation();
        event.preventDefault();
        if (this.editor) {
            this.editor.moveCursorToEnd();
        }
    }
    // TODO ctrl-f ctrl-b ... even vim-mode

    private patchLength(): number {
        if (!this.note || !this.editor) return 0;

        const origin = this.note.content;
        const text = this.editor.getMarkdown();
        if (origin == text) return 0;

        const dmp = new diff_match_patch();
        const patch = dmp.patch_make(origin, text);
        const patchText = dmp.patch_toText(patch);
        return patchText.length;
    }

    private shouldUpdate(): boolean {
        return this.patchLength() > 500;
    }

    private lastSavingDate: Date;
    insaving: boolean = false;
    async doUpdate() {
        if (!this.note || !this.editor) return;

        const origin = this.note.content;
        const text = this.editor.getMarkdown();
        if (origin == text) return;

        const dmp = new diff_match_patch();
        const patch = dmp.patch_make(origin, text);
        const patchText = dmp.patch_toText(patch);
        try {
            this.insaving = true;
            const resp = await this.noteService.updateNote(this.note.id, patchText);
            if (resp.inconsistency > 0) {
                this.toastr.warning("doesn't fully syncronize", "Note");
                return;
            }
            // TODO generation update
            this.note.content = text;
            this.note.generation = resp.generation;
            this.lastSavingDate = new Date();
        } catch {
            this.toastr.warning("update note failed", "Note");
        } finally {
            this.insaving = false;
        }
    }

    async handleBlur(_event: any) {
        // TODO paste text will raise blur event ...
        // which may causes data becoming inconsistency after updating
        return;
    }

    async handleChange(_event: any) {
        if (this.shouldUpdate())
            await this.doUpdate();
    }

    async handleSaveClick(_event: any) {
        await this.doUpdate();
    }

    downloadMarkdown() {
        saveDataAsFile(this.note.content, this.note.title + '.md');
    }

    async handleKeydown(event: KeyboardEvent) {
        if (event.ctrlKey) {
            switch (event.key) {
                case 'm': 
                    await this.doUpdate();
                    break;
                case 'y':
                    this.downloadMarkdown();
                    break;
            }
        }
    }

    async onToggleTitleClick() {
        this.showTitle = false; 
        this.inputTitle=this.note?.title
        await interval(100).pipe(takeUntil(this.destroy$), filter(() => this.titleInputRef.nativeElement != null), take(1)).toPromise();
        const input = this.titleInputRef.nativeElement as HTMLInputElement;
        input.focus();
    }

    async onTitleBlur() {
        if (this.inputTitle == '') {
            this.inputTitle = this.note?.title;
        }

        const oldTitle = this.inputTitle;
        this.showTitle = true;
        if (this.inputTitle == this.note?.title) {
            return;
        }

        try {
            await this.noteService.changeTitle(this.note.id, this.inputTitle);
            this.note.title = this.inputTitle;
        } catch {
            this.toastr.danger("update title failed", "Note");
            this.showTitle = false;
            this.inputTitle = oldTitle;
        }
    }

    async onAddTagClick(tag: string) {
        try {
            await this.noteService.addTags(this.note.id, [ tag ]);
        } catch {
            this.note.tags.splice(this.note.tags.indexOf(tag), 1);
            this.toastr.danger("add tag failed", "Note");
        }
    }

    async onDeleteTagClick(tag: string) {
        try {
            await this.noteService.deleteTags(this.note.id, [ tag ]);
        } catch {
            this.note.tags.push(tag);
            this.toastr.danger("delete tag failed", "Note");
        }
    }
}
