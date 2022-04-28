import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Note } from 'src/app/service/note/note.service';
import { ObjectSharingService } from 'src/app/service/object-sharing.service';


@Component({
    selector: 'app-note-preview',
    template: `
        <div class='previewer' (click)="gotoNote()">
            <a class='pesudo-button' (click)='gotoNote()'></a>
            <app-tui-viewer *ngIf='note' [initialValue]='note?.content'></app-tui-viewer>
        </div>`,
    styleUrls: [`./note-preview.component.scss`]
})
export class NotePreview implements OnInit {
    @Input()
    note: Note;
    @Input()
    generation: boolean = true;

    constructor(private router: Router,
                private sharing: ObjectSharingService,
                private activatedRoute: ActivatedRoute) { 
    }

    gotoNote() {
        const storekey = this.sharing.store(this.note);
        if (this.note.contentType == 'markdown') {
            const params = {
                noteref: storekey,
                noteid: this.note.id,
            };
            if (this.generation)
                params['generation'] = this.note.generation;
            this.router.navigate(["../markdown-viewer"], {
                relativeTo: this.activatedRoute,
                queryParams: params
            });
        }
    }

    ngOnInit(): void {
    }
}
