import { Component, ElementRef, HostListener, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { BeAbsoluteView } from '../absolute-view/absolute-view';
import { FullScreenViewShadow } from '../absolute-view/full-screen-view-shadow';

@Component({
    selector: 'app-sole-window',
    templateUrl: './sole-window.component.html',
    styleUrls: ['./sole-window.component.scss']
})
@BeAbsoluteView()
export class SoleWindowComponent extends FullScreenViewShadow implements OnInit, OnDestroy {
    @Output('bgclick')
    private _bgclick: Subject<void> = new Subject<void>();

    constructor(protected host: ElementRef) {
        super(host);
    }

    @HostListener("document:keydown.escape", ["$event"])
    exitByESC(event: KeyboardEvent) {
        event.stopPropagation();
        this._bgclick.next();
    }

    private backed: boolean = false;
    ngOnInit(): void {
        window.addEventListener('popstate', (event) => {
            event.preventDefault();
            this.backed = true;
            this.onbgclick();
        });

        history.pushState({page: 'new sole window'}, 'sole window', `${location.href}?window`);
    }

    ngOnDestroy(): void {
        if(!this.backed) {
            history.back();
        }
    }

    onbgclick() {
        this._bgclick.next();
    }
}

