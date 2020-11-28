import { Component, OnInit, ElementRef, ViewContainerRef, OnDestroy, Input } from '@angular/core';
import { FullScreenShadowComponent } from '../full-screen-shadow/full-screen-shadow.component';

@Component({
    selector: 'app-notifier',
    templateUrl: './notifier.component.html',
    styleUrls: ['./notifier.component.scss']
})
export class NotifierComponent extends FullScreenShadowComponent implements OnInit {
    @Input()
    private title: string = 'origin';

    constructor(protected host: ElementRef) {
        super(host);
    }

    ngOnInit(): void {
    }
}

