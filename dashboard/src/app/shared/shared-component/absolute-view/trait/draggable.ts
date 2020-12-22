import { Observable, Subject } from 'rxjs';
import { hasTouchScreen, nextTick } from 'src/app/shared/utils';
import { DontOverflow } from './dont-overflow';

function always_return_true(...args) {return true;}

export enum Orientation {
    left = 'left',
    right = 'right',
    bottom = 'bottom',
    top = 'top'
}

export class ViewDraggable extends DontOverflow {
    private prev: [number, number] = null;
    private _overflow: Subject<Orientation> = new Subject<Orientation>();
    get overflow(): Observable<Orientation> {return this._overflow;}

    private filter: (target: HTMLElement) => boolean;
    constructor(dragFilter: (target: HTMLElement) => boolean = always_return_true, left='50%', top='50%') {
        super(left, top);
        this.filter = dragFilter;
    }

    public perform(host: HTMLElement) {
        super.perform(host);
        this.hostElem = host;
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

    private toggle_move_cursor() {
        if(this.hostElem.style.cursor == 'move') {
            this.hostElem.style.cursor = '';
        } else {
            this.hostElem.style.cursor = 'move';
        }
    }

    private checkOverflow(tx: number, ty: number): boolean {
        if(tx + this.left < 0) {
            this._overflow.next(Orientation.left);
            return true;
        } else if (ty + this.top < 0) {
            this._overflow.next(Orientation.top);
            return true;
        } else if (tx + this.left + this.elemWidth > this.parentWidth) {
            this._overflow.next(Orientation.right);
            return true;
        } else if (ty + this.top + this.elemHeight > this.parentHeight) {
            this._overflow.next(Orientation.bottom);
            return true;
        }
        return false;
    }

    private dragstart(ev: DragEvent) {
        if (!this.filter(ev.target as HTMLElement)) return;

        const img = new Image();
        img.src = "assets/img/transparent-1pixel.png";
        ev.dataTransfer.setDragImage(img, 0, 0);
        this.prev = [ev.screenX, ev.screenY];
        this.toggle_move_cursor();
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

        if(!this.checkOverflow(dx, dy)) {
            this.left += dx;
            this.top += dy;
        }
    }

    private dragend(ev: DragEvent) {
        if (!this.filter(ev.target as HTMLElement)) return;
        this.prev = null
        this.toggle_move_cursor();
    }

    private touchstart(ev: TouchEvent) {
        if (!this.filter(ev.target as HTMLElement)) return;
        if(ev.touches.length == 1) {
            const touch = ev.touches.item(0);
            this.prev = [touch.screenX, touch.screenY];
        }
        this.toggle_move_cursor();
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
        this.toggle_move_cursor();
    }
}

