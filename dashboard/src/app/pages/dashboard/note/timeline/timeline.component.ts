import { Component, OnInit } from '@angular/core';
import { NbToastrService } from '@nebular/theme';
import { Note, NoteService } from 'src/app/service/note/note.service';
import { MessageBoxService } from 'src/app/shared/service/message-box.service';


@Component({
    selector: 'app-timeline',
    template: `
    <nb-card>
        <nb-card-header>
            <button nbButton (click)='createNote($event)'>Create</button>
        </nb-card-header>
        <nb-card-body>
            <app-note-preview *ngFor="let note of notes" [note]='note'></app-note-preview>
        </nb-card-body>
    </nb-card>
    `,
    styleUrls: ["./timeline.component.scss"],
    styles: []
})
export class TimelineComponent implements OnInit {
    numberOfNotes: number;
    notes: Note[];

    constructor(private msgbox: MessageBoxService,
                private toastr: NbToastrService,
                private noteService: NoteService) { 
    }

    ngOnInit(): void {
        this.refresh();
    }

    async refresh() {
        try {
            const notes = await this.noteService.getNotes(1, 5);
            this.numberOfNotes = notes.count;
            this.notes = notes.data;
        } catch {
            this.toastr.danger("get notes failed", "Note");
        }
    }

    async createNote(_event: any) {
        const rs = await this.msgbox.create({
            title: "create note",
            message: "create note",
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
