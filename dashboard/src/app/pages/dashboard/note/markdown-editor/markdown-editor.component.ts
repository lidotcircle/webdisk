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
import { EditorView } from 'prosemirror-view';
import { TextSelection } from 'prosemirror-state';
import { LocalSettingService } from 'src/app/service/user/local-setting.service';
import { AsyncLocalStorageService } from 'src/app/shared/service/async-local-storage.service';


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
            <app-tui-editor height="100%" [initialValue]='noteInitContent' [theme]='theme'
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
    noteInitContent: string;
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
                private settings: LocalSettingService,
                private localStorage: AsyncLocalStorageService,
                private nbtheme: NbThemeService)
    {
        this.theme = nbThemeIsDark(this.nbtheme.currentTheme) ? 'dark' : 'light';
        this.destroy$ = new Subject();
        this.showButtons = this.settings.Note_Editor_ShowButtons;
        this.savingInterval = this.settings.Note_Editor_SavingInterval_s * 1000;
    }

    private async savePatchToLocal(patch: string): Promise<void> {
        if (!this.note) return;

        await this.localStorage.set(`${this.note.id}_patch`, patch);
    }

    private async getPatchFromLocal(): Promise<string | null> {
        if (!this.note) return null;

        return await this.localStorage.get(`${this.note.id}_patch`);
    }

    private async clearPatchFromLocal(): Promise<void> {
        if (!this.note) return;

        await this.localStorage.remove(`${this.note.id}_patch`);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();

        const patch = this.notePatch();
        if (patch && this.settings.Markdown_Editor_Saving_When_Leave) {
            this.SavePatch(this.latestContent, patch)
                .then(() => this.toastr.info("Autosave", "Note"), () => {});
        }

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

            const oldPatch = await this.getPatchFromLocal();
            if (this.note) {
                let content = this.note.content;
                if (oldPatch && this.settings.Markdown_Editor_Apply_Local_Patch) {
                    const dmp = new diff_match_patch();
                    const patch = dmp.patch_fromText(oldPatch);
                    const [ patched_content, inconsistencies ] = dmp.patch_apply(patch, content);
                    if (inconsistencies.length > 0 && !inconsistencies.reduce((a, b) => a && b)) {
                        this.toastr.danger("patch inconsistency", "Note");
                    }
                    content = patched_content;
                }

                this.noteInitContent = content;
                this.latestContent = content;
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
                .subscribe(() => this.howManyBeModified = this.patchLength);
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

    @HostListener("document:keydown.alt.a", ["$event"])
    onAltA(event: KeyboardEvent) {
        event.stopPropagation();
        event.preventDefault();
        if (this.editor) {
            this.editor.moveCursorToStart();
        }
    }

    @HostListener("document:keydown.alt.e", ["$event"])
    onAltE(event: KeyboardEvent) {
        event.stopPropagation();
        event.preventDefault();
        if (this.editor) {
            this.editor.moveCursorToEnd();
        }
    }

    @HostListener("document:keydown.alt.b", ["$event"])
    onAltB(event: KeyboardEvent) {
        event.stopPropagation();
        event.preventDefault();
        const view = this.pmView()
        if (!view || !view.hasFocus()) return;

        view.state.doc
        const { from } = view.state.selection;
        if (from == 1) return;
        const newpos = view.state.doc.resolve(from - 1);
        const newsel = new TextSelection(newpos, newpos);
        view.dispatch(view.state.tr.setSelection(newsel));
    }

    @HostListener("document:keydown.alt.f", ["$event"])
    onAltF(event: KeyboardEvent) {
        event.stopPropagation();
        event.preventDefault();
        const view = this.pmView()
        if (!view || !view.hasFocus()) return;

        const { to } = view.state.selection;
        if (view.state.doc.nodeSize <= to + 2) return;
        const newpos = view.state.doc.resolve(to + 1);
        const newsel = new TextSelection(newpos, newpos);
        view.dispatch(view.state.tr.setSelection(newsel));
    }

    @HostListener("document:keydown.alt.p", ["$event"])
    onAltP(event: KeyboardEvent) {
        event.stopPropagation();
        event.preventDefault();
        const view = this.pmView()
        if (!view || !view.hasFocus()) return;

        // TODO
    }

    @HostListener("document:keydown.alt.n", ["$event"])
    onAltN(event: KeyboardEvent) {
        event.stopPropagation();
        event.preventDefault();
        const view = this.pmView()
        if (!view || !view.hasFocus()) return;

        // TODO
    }

    private pmView(): EditorView {
        return (this.editor as any)?.mdEditor?.view
    }

    private get patchLength(): number {
        const patch = this.notePatch();
        if (!patch) return 0;

        return patch.length;
    }

    private notePatch(): string | null {
        if (!this.note) return null;

        const origin = this.note.content;
        const text = this.latestContent;
        if (origin == text) return null;

        const dmp = new diff_match_patch();
        const patch = dmp.patch_make(origin, text);
        const patchText = dmp.patch_toText(patch);
        return patchText;
    }

    private shouldUpdate(patch: string): boolean {
        if (!patch) return false;
        return patch && patch.length > 500;
    }

    private async SavePatch(text: string, patch: string): Promise<void> {
        try {
            this.insaving = true;
            const resp = await this.noteService.updateNote(this.note.id, patch);
            if (resp.inconsistency > 0) {
                this.toastr.warning("doesn't fully syncronize", "Note");
                return;
            }
            await this.clearPatchFromLocal();
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

    private lastSavingDate: Date;
    insaving: boolean = false;
    async doUpdate() {
        if (!this.note || !this.editor || this.insaving) return;

        const origin = this.note.content;
        const text = this.latestContent;
        if (origin == text) return;

        const dmp = new diff_match_patch();
        const patch = dmp.patch_make(origin, text);
        const patchText = dmp.patch_toText(patch);
        await this.SavePatch(text, patchText);
    }

    async handleBlur(_event: any) {
        // TODO paste text will raise blur event ...
        // which may causes data becoming inconsistency after updating
        return;
    }

    private latestContent: string;
    async handleChange(_event: any) {
        this.latestContent = this.editor.getMarkdown();
        const patch = this.notePatch();
        if (this.shouldUpdate(patch)) {
            await this.doUpdate();
        } else {
            await this.savePatchToLocal(patch);
        }
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
