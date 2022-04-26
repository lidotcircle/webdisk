import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { Note, NoteService } from 'src/app/service/note/note.service';
import { ObjectSharingService } from 'src/app/service/object-sharing.service';


@Component({
    selector: 'app-markdown-note-history',
    template: `
    <nb-card>
        <nb-card-header>
            <div class='title'>{{ note?.title }}</div>
        </nb-card-header>
        <nb-card-body>
        </nb-card-body>
    </nb-card>
    `,
    styleUrls: ["./markdown-note-history.component.scss"],
    styles: []
})
export class MarkdownNoteHistoryComponent implements OnInit {
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
}
