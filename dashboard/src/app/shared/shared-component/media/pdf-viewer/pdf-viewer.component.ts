import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-pdf-viewer',
    templateUrl: './pdf-viewer.component.html',
    styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewerComponent implements OnInit {
    @Input('src')
    pdfsrc: string;

    @Input('page')
    page: string;
    @Output('pageChange')
    pageChange: EventEmitter<number> = new EventEmitter();

    @Input('filename')
    filename: string;

    constructor() { }

    ngOnInit(): void {}
}

