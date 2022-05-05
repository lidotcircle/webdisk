import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

export interface TOCItem {
    levelText: string;
    title: string;
    children?: TOCItem[];
};

@Component({
    selector: 'app-toc',
    template: `
    <li>
        <span class='title-line' *ngIf='toc.title'>
            <a (click)='scrollIntoView()'>
                <span class="title-no">{{toc.levelText}}</span>
                <span class='title' [innerHTML]='toc.title'></span>
            </a>
            <div (click)='scrollIntoView()' class='take-space'></div>
            <button nbButton *ngIf='toggleButton' ghost status='basic' size='small' (click)='showChildren = !showChildren'>
                <span *ngIf='showChildren'> <i class='fas fa-angle-down'></i></span>
                <span *ngIf='!showChildren'><i class='fas fa-angle-right'></i></span>
            </button>
        </span>
        <ul *ngIf='showChildren' [attr.class]='!toggleButton ? "noindent" : null'>
            <app-toc *ngFor="let item of toc.children || []" [toc]="item" (scrollTo)='scrollTo.next($event)'></app-toc>
        </ul>
    </li>
    `,
    styleUrls: [`./table-of-content.component.scss`],
})
export class TableOfContentsComponent implements OnInit {
    @Input() toc: TOCItem 
    @Output() scrollTo: EventEmitter<string> = new EventEmitter();

    targetID: string;
    toggleButton: boolean = false;
    showChildren: boolean = true;

    ngOnInit(): void {
        const levelno = this.toc?.levelText.toLowerCase() || '';
        this.targetID = 'toc-' + levelno;
        this.toggleButton = levelno.indexOf('.') < 0 && this.toc.children && this.toc.children.length > 0;
    }

    scrollIntoView() {
        const element = document.getElementById(this.targetID);
        if (!element) return;

        element.scrollIntoView({
            behavior: 'smooth',
        });

        let href = location.href;
        const hashidx = href.indexOf('#');
        if (hashidx > 0)
            href = href.substring(0, hashidx);

        history.pushState(null, null, `${href}#${this.targetID}`);
        this.scrollTo.next(this.targetID);
    }
}
