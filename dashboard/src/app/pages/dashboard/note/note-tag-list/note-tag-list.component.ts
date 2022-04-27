import { Component, OnInit } from '@angular/core';
import { NbToastrService } from '@nebular/theme';
import { NoteService } from 'src/app/service/note/note.service';


@Component({
    selector: 'app-note-tag-list',
    template: `
    <nb-card>
        <nb-card-body>
            <div *ngFor='let tag of tags'>
            </div>
        </nb-card-body>
    </nb-card>

    `,
    styleUrls: ["./note-tag-list.component.scss"]
})
export class NoteTagListComponent implements OnInit {
    tags: string[];

    constructor(private noteService: NoteService,
                private toastr: NbToastrService) { }

    ngOnInit(): void {
        this.fetchTags();
    }

    async fetchTags() {
        try {
            this.tags = await this.noteService.getTags();
        } catch {
            this.toastr.danger("get tags failed", "Note");
        }
    }
}
