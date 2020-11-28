import { Component, OnInit, ElementRef, ViewContainerRef, OnDestroy, Input } from '@angular/core';
import { FullScreenViewShadow } from '../absolute-view/full-screen-view-shadow';

@Component({
    selector: 'app-notifier',
    templateUrl: './notifier.component.html',
    styleUrls: ['./notifier.component.scss']
})
export class NotifierComponent extends FullScreenViewShadow implements OnInit {
    @Input()
    title: string = 'origin';
    constructor(protected host: ElementRef) {
        super(host);
    }

    ngOnInit(): void {
    }
}

