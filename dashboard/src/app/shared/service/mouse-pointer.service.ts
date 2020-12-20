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

    get coordinate(): [number, number] {return [Math.floor(this.clientX), Math.floor(this.clientY)];}
    get pixelCoordinate(): [string, string] {
        return [this.coordinate[0].toString() + 'px', this.coordinate[1].toString() + 'px'];
    }
}

