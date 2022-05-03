import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class MousePointerService {
    private clientX: number;
    private clientY: number;

    constructor() {
        document.body.addEventListener('pointermove', (ev: PointerEvent) => {
            this.clientX = ev.clientX;
            this.clientY = ev.clientY;
        });
    }

    get coordinate(): [number, number] {
        if (this.clientY != null) {
            return [Math.floor(this.clientX), Math.floor(this.clientY)];
        } else {
            return null;
        }
    }
    get pixelCoordinate(): [string, string] {
        const coord = this.coordinate;
        if (coord) {
            return [coord[0].toString() + 'px', coord[1].toString() + 'px'];
        } else {
            return null;
        }
    }
}

