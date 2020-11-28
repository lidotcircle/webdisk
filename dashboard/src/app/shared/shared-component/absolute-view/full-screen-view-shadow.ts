import { ElementRef } from '@angular/core';
import { FullScreenView } from './full-screen-view';

export class FullScreenViewShadow extends FullScreenView {
    constructor(protected host: ElementRef) {
        super(host);
        const style = (host.nativeElement as HTMLElement).style;
        style.background = "rgba(100, 100, 100, 0.3)";
        style.zIndex     = "100";
    }
}

