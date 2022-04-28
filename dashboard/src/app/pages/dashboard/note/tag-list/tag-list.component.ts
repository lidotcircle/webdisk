import { Component, ElementRef, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';


@Component({
    selector: 'app-tag-list',
    template: `
    <div *ngFor='let tag of tags; let i = index' class='tag tag-cx'>
        <nb-icon icon='star' (click)='onDeleteTagClick(i)'></nb-icon>
        <span class='tag-text'>{{ tag }}</span>
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

    constructor()
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
        if (!this.deleteButton) return;

        const tag = this.tags[n];
        this.tags.splice(n, 1);
        this.deleteTag.next(tag);
    }
}
