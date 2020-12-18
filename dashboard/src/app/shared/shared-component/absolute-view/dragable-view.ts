import { ElementRef } from '@angular/core';
import { AbsoluteView } from './absolute-view';
import { ViewDraggable } from './trait/draggable';

export class DragableView extends AbsoluteView {
    constructor(protected host: ElementRef) {
        super(host, new ViewDraggable());
    }
}

