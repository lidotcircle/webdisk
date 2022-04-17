import { Component, ElementRef, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { KeyboardPressService, Keycode } from '../../service/keyboard-press.service';
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

    constructor(protected host: ElementRef,
                private keyboard: KeyboardPressService) {
        super(host);
    }

    private subscription: Subscription;
    private backed: boolean = false;
    ngOnInit(): void {
        this.subscription = this.keyboard.up.subscribe(key => {
            const elem = this.host.nativeElement as HTMLElement;

            if(elem.clientWidth > 0 && key.code == Keycode.ESC) {
                this._bgclick.next();
            }
        });

        window.addEventListener('popstate', (event) => {
            event.preventDefault();
            this.backed = true;
            this.onbgclick();
        });

        history.pushState({page: 'new sole window'}, 'sole window', `${location.href}?window`);
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
        if(!this.backed) {
            history.back();
        }
    }

    onbgclick() {
        this._bgclick.next();
    }
}

