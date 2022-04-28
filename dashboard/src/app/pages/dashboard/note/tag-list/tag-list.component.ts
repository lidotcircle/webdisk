import { Component, ElementRef, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subject } from 'rxjs';
import { filter, take } from 'rxjs/operators';


@Component({
    selector: 'app-tag-list',
    template: `
    <div *ngFor='let tag of tags; let i = index' class='tag tag-cx'>
        <a (click)='onDeleteTagClick(i)'><nb-icon icon='star'></nb-icon></a>
        <a (click)='onTagClick(i)'><span class='tag-text'>{{ tag }}</span></a>
    </div>
    <div *ngIf='!inAddingTag && addButton' class='tag add-tag'>
        <button ghost nbButton [disabled]='addButtonDisabled' status='primary'  (click)='onAddTagClick()'>
            <nb-icon icon='plus-square'></nb-icon>
        </button>
    </div>
    <div *ngIf='inAddingTag' class='tag add-tag-input'>
        <input class='info-input' nbInput type='text' 
               [disabled]='addButtonDisabled' [(ngModel)]='newtag'
               (keyup.enter)='onTagInputBlur_addTag()'
               (blur)='onTagInputBlur_addTag()' #input>
    </div>
    `,
    styleUrls: ["./tag-list.component.scss"],
    styles: []
})
export class TagListComponent implements OnInit, OnDestroy {
    newtag: string;
    inAddingTag: boolean;
    @Input() tags: string[];
    @Input() addButton: boolean;
    @Input() deleteButton: boolean;
    @Input() addButtonDisabled: boolean;
    @Output() deleteTag = new Subject<string>();
    @Output() addTag = new Subject<string>();
    private destroy$: Subject<void>;
    @ViewChild('input')
    private input: ElementRef;

    constructor(private router: Router)
    {
        this.destroy$ = new Subject();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnInit(): void {
    }

    async onAddTagClick() {
        this.inAddingTag = true;
        await interval(100).pipe(
            filter(() => this.input.nativeElement != null && (this.input.nativeElement as HTMLElement).clientHeight > 0),
            take(1),
        ).toPromise();
        const input = this.input.nativeElement as HTMLInputElement;
        input.focus();
    }

    async onTagClick() {
    }

    async onTagInputBlur_addTag() {
        const input = this.input.nativeElement as HTMLInputElement;
        input.blur();

        if (this.newtag == null || this.newtag == '' || 
            this.tags.indexOf(this.newtag) != -1)
        {
            this.inAddingTag = false;
            this.newtag = '';
            return;
        }

        this.tags.push(this.newtag);
        this.addTag.next(this.newtag);
        this.newtag = '';
        this.inAddingTag = false;
    }

    async onDeleteTagClick(n: number) {
        const tag = this.tags[n];

        if (!this.deleteButton) {
            this.router.navigate(["/wd/dashboard/note/notes-of-tag"], {
                queryParams: {
                    tag
                }
            });
        } else {
            this.tags.splice(n, 1);
            this.deleteTag.next(tag);
        }
    }
}
