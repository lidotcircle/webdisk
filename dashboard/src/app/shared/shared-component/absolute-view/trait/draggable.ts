import { Observable, Subject } from 'rxjs';
import { hasTouchScreen } from 'src/app/shared/utils';
import { ViewTrait } from './view-trait';

function always_return_true(...args) {return true;}

export enum Orientation {
    left = 'left',
    right = 'right',
    bottom = 'bottom',
    top = 'top'
}

export class ViewDraggable extends ViewTrait {
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

    private filter: (target: HTMLElement) => boolean;
    private hostElem;
    private top: string;
    private left: string;
    constructor(dragFilter: (target: HTMLElement) => boolean = always_return_true, left='50%', top='50%') {
        super();
        this.left = left;
        this.top = top;
        this.filter = dragFilter;
    }

    public perform(host: HTMLElement) {
        this.hostElem = host;
        this.hostElem.style.top    = this.top;
        this.hostElem.style.left   = this.left;
        this.hostElem.setAttribute('draggable', 'true');

        if(hasTouchScreen()) {
            this.hostElem.ontouchstart = this.touchstart.bind(this);
            this.hostElem.ontouchmove  = this.touchmove.bind(this);
            this.hostElem.ontouchend   = this.touchend.bind(this);
        } else {
            this.hostElem.ondragstart  = this.dragstart.bind(this);
            this.hostElem.ondragover   = this.dragover.bind(this);
            this.hostElem.ondragend    = this.dragend.bind(this);
        }
    }

    private refresh() {
        const sa = window.getComputedStyle(this.hostElem);
        this.elemWidth  = parseInt(sa.width);
        this.elemHeight = parseInt(sa.height);
        this.elemTop    = parseInt(sa.top);
        this.elemLeft   = parseInt(sa.left);

        let absoluteContainer = this.hostElem.parentElement;
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
        if (!this.filter(ev.target as HTMLElement)) return;

        this.refresh();
        const img = new Image();
        img.src = "assets/img/transparent-1pixel.png";
        ev.dataTransfer.setDragImage(img, 0, 0);
        this.prev = [ev.screenX, ev.screenY];
    }

    private dragover(ev: DragEvent) {
        if (!this.filter(ev.target as HTMLElement)) return;
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
            this.hostElem.style.transform  = `translate(${this.translateOffset[0]}px, ${this.translateOffset[1]}px)`;
        }
    }

    private dragend(ev: DragEvent) {
        if (!this.filter(ev.target as HTMLElement)) return;
        this.prev = null
    }

    private touchstart(ev: TouchEvent) {
        if (!this.filter(ev.target as HTMLElement)) return;
        this.refresh();
        if(ev.touches.length == 1) {
            const touch = ev.touches.item(0);
            this.prev = [touch.screenX, touch.screenY];
        }
    }

    private touchmove(ev: TouchEvent) {
        if (!this.filter(ev.target as HTMLElement)) return;
        ev.preventDefault();
        if(ev.touches.length == 1) {
            const touch = ev.touches.item(0);
            this.moveToNext(touch.screenX, touch.screenY);
        }
    }

    private touchend(ev: TouchEvent) {
        if (!this.filter(ev.target as HTMLElement)) return;
        this.prev = null;
    }

}

