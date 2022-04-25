import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { Note, NoteService } from 'src/app/service/note/note.service';
import { ObjectSharingService } from 'src/app/service/object-sharing.service';
import { TuiEditorComponent } from 'src/app/shared/shared-component/toast-ui/tui-editor/tui-editor.component';
import { diff_match_patch } from 'diff-match-patch';


@Component({
    selector: 'app-markdown',
    template: `
    <nb-card>
        <nb-card-header>
        </nb-card-header>
        <nb-card-body>
            <app-tui-editor height="100%" [initialValue]='note?.content' (blur)='handleBlur($event)' #editor></app-tui-editor>
        </nb-card-body>
    </nb-card>
    `,
    styleUrls: ["./markdown.component.scss"],
    styles: []
})
export class MarkdownComponent implements OnInit {
    note: Note;
    @ViewChild("editor", { static: true})
    private editorComponentRef: TuiEditorComponent;
    private get editor() { return this.editorComponentRef.editor; }

    constructor(private toastr: NbToastrService,
                private noteService: NoteService,
                private sharing: ObjectSharingService,
                private activatedRoute: ActivatedRoute) {
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
    }

    async doUpdate() {
        const origin = this.note.content;
        const text = this.editor.getMarkdown();
        if (origin == text) return;

        const dmp = new diff_match_patch();
        const patch = dmp.patch_make(origin, text);
        const patchText = dmp.patch_toText(patch);
        try {
            const resp = await this.noteService.updateNote(this.note.id, patchText);
            if (resp.inconsistency > 0) {
                this.toastr.warning("doesn't fully syncronize", "Note");
                return;
            }
            // TODO generation update
            this.note.content = text;
            this.note.generation = resp.generation;
        } catch {
            this.toastr.warning("update note failed", "Note");
        }
    }

    async handleBlur(_event: any) {
        await this.doUpdate();
    }
}
