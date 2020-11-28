import { ElementRef, Input } from '@angular/core';
import { AbsoluteView } from './absolute-view';
import { nextTick } from '../../utils';

export class MenuView extends AbsoluteView {
    @Input()
    private positionX: number;
    @Input()
    private positionY: number;

    constructor(protected host: ElementRef) {
        super(host);
        nextTick(() => {
            this.elem.style.left = this.positionX + 'px';
            this.elem.style.top  = this.positionY + 'px';
        });
    }
}

