import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbThemeService } from '@nebular/theme';
import { Note } from 'src/app/service/note/note.service';
import { ObjectSharingService } from 'src/app/service/object-sharing.service';
import { nbThemeIsDark } from 'src/app/shared/utils';
import { Parser as TUIParser } from '@toast-ui/editor/types/toastmark';
declare const require: any;
const Parser = require('@toast-ui/toastmark').Parser;


@Component({
    selector: 'app-note-preview',
    template: `
        <div class='previewer' (click)="gotoNote()">
            <a class='pesudo-button' (click)='gotoNote()'></a>
            <app-tui-viewer [theme]='theme' *ngIf='note' [initialValue]='thinContent'></app-tui-viewer>
        </div>`,
    styleUrls: [`./note-preview.component.scss`]
})
export class NotePreview implements OnInit {
    @Input()
    note: Note;
    @Input()
    generation: boolean = true;
    theme: string = 'light';
    thinContent: string;

    constructor(private router: Router,
                private sharing: ObjectSharingService,
                private nbThemeService: NbThemeService,
                private activatedRoute: ActivatedRoute)
    {
        this.theme = nbThemeIsDark(this.nbThemeService.currentTheme) ? 'dark' : 'light';
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
        this.thinContent = this.note?.content;
        if (this.thinContent) {
            let firstTenNonEmpty: number = 0;
            let firstTenEmpty: number = 0;
            for (const line of this.thinContent.split('\n')) {
                if (line.trim().length > 0) {
                    firstTenNonEmpty++;
                } else {
                    firstTenEmpty++;
                }

                if (firstTenNonEmpty > 10) {
                    break;
                }
            }
            const parser: TUIParser = new Parser();
            const rootnode = parser.parse(this.thinContent);
            let child = rootnode?.firstChild;
            let nl: number;
            while (child != null) {
                if (child.sourcepos &&child.sourcepos[1]) {
                    if (child.sourcepos[1][0] > 20 + firstTenEmpty) {
                        nl = child.sourcepos[1][0];
                        break;
                    }
                }

                child = child.next;
            }

            if (nl != null) {
                this.thinContent = this.thinContent.split('\n').slice(0, nl).join('\n');
            }
        }
    }
}
