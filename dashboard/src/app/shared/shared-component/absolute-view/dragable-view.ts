import { ElementRef } from '@angular/core';
import { AbsoluteView } from './absolute-view';
import { hasTouchScreen } from '../../utils';
import { Observable, bindNodeCallback, Subject } from 'rxjs';

export enum Orientation {
    left = 'left',
    right = 'right',
    bottom = 'bottom',
    top = 'top'
}

export class DragableView extends AbsoluteView {
    private prev: [number, number] = null;
    private translateOffset: [number, number] = [0,0];
    private _overflow: Subject<Orientation> = new Subject<Orientation>();
    get overflow(): Observable<Orientation> {return this._overflow;}
    private parentWidth: number;
    private parentHeight: number;
    private elemWidth: number;
    private elemHeight: number;
    private elemTop: number;
    private elemLeft: number;

    constructor(protected host: ElementRef) {
        super(host);
        this.elem.style.top    = '50%';
        this.elem.style.left   = '50%';
        this.elem.setAttribute('draggable', 'true');

        if(hasTouchScreen()) {
            this.elem.ontouchstart = this.touchstart.bind(this);
            this.elem.ontouchmove  = this.touchmove.bind(this);
            this.elem.ontouchend   = this.touchend.bind(this);
        } else {
            this.elem.ondragstart  = this.dragstart.bind(this);
            this.elem.ondragover   = this.dragover.bind(this);
            this.elem.ondragend    = this.dragend.bind(this);
        }
    }

    private refresh() {
        const sa = window.getComputedStyle(this.elem);
        this.elemWidth  = parseInt(sa.width);
        this.elemHeight = parseInt(sa.height);
        this.elemTop    = parseInt(sa.top);
        this.elemLeft   = parseInt(sa.left);

        let absoluteContainer = this.elem.parentElement;
        while(absoluteContainer != document.body &&
              !absoluteContainer.style.position.match(/absolute|relative/)) {
            absoluteContainer = absoluteContainer.parentElement;
        }
        const sb = window.getComputedStyle(absoluteContainer);
        this.parentWidth  = parseInt(sb.width);
        this.parentHeight = parseInt(sb.height);
    }

    private checkOverflow(tx: number, ty: number): boolean {
        if(tx + this.elemLeft < 0) {
            this._overflow.next(Orientation.left);
            return true;
        } else if (ty + this.elemTop < 0) {
            this._overflow.next(Orientation.top);
            return true;
        } else if (tx + this.elemLeft + this.elemWidth > this.parentWidth) {
            this._overflow.next(Orientation.right);
            return true;
        } else if (ty + this.elemTop + this.elemHeight > this.parentHeight) {
            return true;
        }
        return false;
    }

    private dragstart(ev: DragEvent) {
        this.refresh();
        const img = new Image();
        img.src = "assets/img/transparent-1pixel.png";
        ev.dataTransfer.setDragImage(img, 0, 0);
        this.prev = [ev.screenX, ev.screenY];
    }

    private dragover(ev: DragEvent) {
        this.moveToNext(ev.screenX, ev.screenY);
    }

    private moveToNext(sx: number, sy: number) {
        if(this.prev == null) return;

        let dx = sx - this.prev[0];
        let dy = sy - this.prev[1];
        this.prev = [sx, sy];
        const tx = this.translateOffset[0] + dx; 
        const ty = this.translateOffset[1] + dy; 

        if(!this.checkOverflow(tx, ty)) {
            this.translateOffset = [tx, ty];
            this.elem.style.transform  = `translate(${this.translateOffset[0]}px, ${this.translateOffset[1]}px)`;
        }
    }

    private dragend(ev: DragEvent) {
        this.prev = null
    }

    private touchstart(ev: TouchEvent) {
        this.refresh();
        if(ev.touches.length == 1) {
            const touch = ev.touches.item(0);
            this.prev = [touch.screenX, touch.screenY];
        }
    }

    private touchmove(ev: TouchEvent) {
        if(ev.touches.length == 1) {
            const touch = ev.touches.item(0);
            this.moveToNext(touch.screenX, touch.screenY);
        }
    }

    private touchend(ev: TouchEvent) {
        this.prev = null;
    }
}

