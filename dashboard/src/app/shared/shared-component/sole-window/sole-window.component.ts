import { Component, ElementRef, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { AbsoluteView, BeAbsoluteView } from '../absolute-view/absolute-view';
import { FullScreenViewShadow } from '../absolute-view/full-screen-view-shadow';

@Component({
    selector: 'app-sole-window',
    templateUrl: './sole-window.component.html',
    styleUrls: ['./sole-window.component.scss']
})
@BeAbsoluteView()
export class SoleWindowComponent extends FullScreenViewShadow implements OnInit {
    @Output('bgclick')
    private _bgclick: Subject<void> = new Subject<void>();

    constructor(protected host: ElementRef) {
        super(host);
    }

    ngOnInit(): void {
    }

    onbgclick() {
        this._bgclick.next();
    }
}

