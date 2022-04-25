import { Component, OnInit } from '@angular/core';


@Component({
    selector: 'app-markdown',
    template: `
    <nb-card>
        <nb-card-header>
        hello
        </nb-card-header>
        <nb-card-body>
            <app-tui-editor height="100%"></app-tui-editor>
        </nb-card-body>
    </nb-card>
    `,
    styleUrls: ["./markdown.component.scss"],
    styles: []
})
export class MarkdownComponent implements OnInit {
    constructor() { 
    }

    ngOnInit(): void {
    }
}
