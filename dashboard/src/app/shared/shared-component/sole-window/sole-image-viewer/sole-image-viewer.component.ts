import { Component, Input, OnInit } from '@angular/core';
import { SoleWindowClickClose } from '../sole-window-click-close';

@Component({
  selector: 'app-sole-image-viewer',
  templateUrl: './sole-image-viewer.component.html',
  styleUrls: ['./sole-image-viewer.component.scss']
})
export class SoleImageViewerComponent extends SoleWindowClickClose implements OnInit {
    @Input('images')
    images: string;
    @Input('index')
    index: number;

    constructor() {
        super();
    }

    ngOnInit(): void {
    }
}
