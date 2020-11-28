import { ElementRef } from '@angular/core';
import { AbsoluteView } from './absolute-view';

export class FullScreenView extends AbsoluteView {
    constructor(protected host: ElementRef) {
        super(host);
        this.elem.style.width  = "100%";
        this.elem.style.height = "100%";
        this.elem.style.top    = '0em';
        this.elem.style.left   = '0em';
    }
}

