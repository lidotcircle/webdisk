import { ElementRef } from '@angular/core';
import { AbsoluteView } from './absolute-view';

export class DragableView extends AbsoluteView {
    private prev: [number, number] = null;
    private translateOffset: [number, number] = [0,0];

    constructor(protected host: ElementRef) {
        super(host);
        this.elem.style.top    = '50%';
        this.elem.style.left   = '50%';
        this.elem.setAttribute('draggable', 'true');

        this.elem.ondragstart = this.dragstart.bind(this);
        this.elem.ondragover  = this.dragover.bind(this);
        this.elem.ondragend   = this.dragend.bind(this);
    }

    private dragstart(ev: DragEvent) {
        const img = new Image();
        img.src = "assets/img/transparent-1pixel.png";
        ev.dataTransfer.setDragImage(img, 0, 0);
        this.prev = [ev.screenX, ev.screenY];
    }

    private dragover(ev: DragEvent) {
        let dx = ev.screenX - this.prev[0];
        let dy = ev.screenY - this.prev[1];
        this.prev = [ev.screenX, ev.screenY];
        this.translateOffset[0] += dx; 
        this.translateOffset[1] += dy; 
        this.elem.style.transform  = `translate(${this.translateOffset[0]}px, ${this.translateOffset[1]}px)`;
    }

    private dragend(ev: DragEvent) {
        this.prev = null
    }
}

