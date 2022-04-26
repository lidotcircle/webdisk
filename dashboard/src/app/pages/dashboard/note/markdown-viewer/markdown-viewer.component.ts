import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { Note, NoteService } from 'src/app/service/note/note.service';
import { ObjectSharingService } from 'src/app/service/object-sharing.service';


@Component({
    selector: 'app-markdown-viewer',
    template: `
    <nb-card>
        <nb-card-header>
            <div class='title'>{{ note?.title }}</div>
        </nb-card-header>
        <nb-card-body>
            <app-tui-viewer [initialValue]='note?.content'></app-tui-viewer>
        </nb-card-body>
        <nb-card-footer>
            <button status='primary' size='small' nbButton (click)='gotoEditor()'>edit</button>
            <button status='primary' size='small' nbButton (click)='gotoHistory()'>history</button>
            <button status='danger'  size='small' nbButton (click)='deleteNote()'>delete</button>
        </nb-card-footer>
    </nb-card>
    `,
    styleUrls: ["./markdown-viewer.component.scss"],
    styles: []
})
export class MarkdownViewerComponent implements OnInit {
    note: Note;

    constructor(private toastr: NbToastrService,
                private router: Router,
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
    }
}
