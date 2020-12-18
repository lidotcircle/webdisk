import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-window-toolbar',
    templateUrl: './window-toolbar.component.html',
    styleUrls: ['./window-toolbar.component.scss']
})
export class WindowToolbarComponent implements OnInit {
    @Input('title')
    title: string = 'webdisk';

    @Output('close')
    private close: EventEmitter<void> = new EventEmitter<void>();

    constructor() {}

    ngOnInit(): void {
    }

    onClose() {
        this.close.emit();
    }
}

