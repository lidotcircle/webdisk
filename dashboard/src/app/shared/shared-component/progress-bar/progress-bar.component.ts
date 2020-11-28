import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DragableView } from '../absolute-view/dragable-view';

@Component({
    selector: 'app-progress-bar',
    templateUrl: './progress-bar.component.html',
    styleUrls: ['./progress-bar.component.scss']
})
export class ProgressBarComponent extends DragableView implements OnInit {
    constructor(protected host: ElementRef) {
        super(host);
    }

    ngOnInit(): void {
    }
}

