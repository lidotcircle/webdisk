import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-window',
  templateUrl: './window.component.html',
  styleUrls: ['./window.component.scss']
})
export class WindowComponent implements OnInit {
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

