import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Note } from 'src/app/service/note/note.service';
import { ObjectSharingService } from 'src/app/service/object-sharing.service';


@Component({
    selector: 'app-note-preview',
    template: `
        <div class='previewer' (click)="gotoNote()">
            <app-tui-viewer *ngIf='note' [initialValue]='note?.content'></app-tui-viewer>
        </div>`,
    styleUrls: [`./note-preview.component.scss`]
})
export class NotePreview implements OnInit {
    @Input()
    note: Note;

    constructor(private router: Router,
                private sharing: ObjectSharingService,
                private activatedRoute: ActivatedRoute) { 
    }

    gotoNote() {
        const storekey = this.sharing.store(this.note);
        if (this.note.contentType == 'markdown') {
            this.router.navigate(["../markdown"], {
                relativeTo: this.activatedRoute,
                queryParams: {
                    noteref: storekey,
                    noteid: this.note.id,
                }
            });
        }
    }

    ngOnInit(): void {
    }
}
