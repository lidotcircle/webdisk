import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SoleWindowClickClose } from '../sole-window-click-close';

@Component({
    selector: 'app-sole-pdf-viewer',
    templateUrl: './sole-pdf-viewer.component.html',
    styleUrls: ['./sole-pdf-viewer.component.scss']
})
export class SolePdfViewerComponent extends SoleWindowClickClose implements OnInit {
    @Input('src')
    src: string;

    @Input('page')
    page: number;
    @Output('pageChange')
    pageChange: EventEmitter<number> = new EventEmitter();

    @Input('filename')
    filename: string;

    constructor() {
        super();
    }

    ngOnInit(): void {
    }
}

