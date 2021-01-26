import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AddMatIconService } from './add-mat-icon.service';

class TransformMatrix {
    private e11: number = 1;
    private e12: number = 0;
    private e21: number = 0;
    private e22: number = 1;

    private movex: number = 0;
    private movey: number = 0;

    get transform(): string {
        return `matrix(${this.e11}, ${this.e12}, ${this.e21}, ${this.e22}, ${this.movex.toFixed(0)}, ${this.movey.toFixed(0)})`;
    }
    get offset(): [number, number] {return [this.movex, this.movey];}

    applyTransform(matrix: TransformMatrix) {
        const n11 = matrix.e11 * this.e11 + matrix.e12 * this.e21;
        const n12 = matrix.e11 * this.e12 + matrix.e12 * this.e22;
        const n21 = matrix.e21 * this.e11 + matrix.e22 * this.e21;
        const n22 = matrix.e21 * this.e12 + matrix.e22 * this.e22;

        const m1 = matrix.e11 * this.movex + matrix.e12 * this.movey + matrix.movex;
        const m2 = matrix.e21 * this.movex + matrix.e22 * this.movey + matrix.movey;

        this.e11 = n11; this.e12 = n12; this.e21 = n21; this.e22 = n22;
        this.movex = m1; this.movey = m2;
    }

    reset() {
        this.e11 = this.e22 = 1;
        this.e12 = this.e21 = 0;
        this.movex = 0;
        this.movey = 0;
    }

    move(x: number, y: number) {
        this.movex += x;
        this.movey += y;
    }

    rotateAt(deg: number, xy: [number, number]) {
        const t = new TransformMatrix();
        const rad = deg * Math.PI / 180;
        t.e11 = t.e22 = Math.cos(rad);
        t.e12 = -(t.e21 = Math.sin(rad));
        t.movex = xy[0];
        t.movey = xy[1];
        this.applyTransform(t);
    }

    scaleXYAt(xs: number, ys: number, xy: [number, number]) {
        const t = new TransformMatrix();
        t.e11 = xs; t.e22 = ys;
        t.e12 = t.e21 = 0;
        t.movex = xy[0];
        t.movey = xy[1];
        this.applyTransform(t);
    }

    scaleAt(s: number, xy: [number, number]) {this.scaleXYAt(s, s, xy);}
}

@Component({
    selector: 'app-image-viewer',
    templateUrl: './image-viewer.component.html',
    styleUrls: ['./image-viewer.component.scss']
})
export class ImageViewerComponent implements OnInit {
    @Input('images')
    images: string[] = [];

    @Input('index')
    imageIndex: number = 0;
    @Output('indexChange')
    indexChange: EventEmitter<number> = new EventEmitter();

    private transformM: TransformMatrix = new TransformMatrix();

    @ViewChild('imageanchor', {static: true})
    private imageanchor: ElementRef;

    @ViewChild('imagex', {static: true})
    private imagex: ElementRef;

    @ViewChild('tools', {static: true})
    private tools: ElementRef;

    @ViewChild('navbutton', {static: true})
    private navs: ElementRef;

    constructor(private addMatIcon: AddMatIconService) {}

    ngOnInit(): void {}

    private closed;
    toggleTools() {
        const elem = this.tools.nativeElement as HTMLElement;
        const elem2 = this.navs.nativeElement as HTMLElement;
        if(this.closed) {
            elem.style.transform = '';
            elem2.style.display = 'flex';
        } else {
            elem.style.transform = `translate(0, ${elem.clientHeight}px)`;
            elem2.style.display = 'none';
        }
        this.closed = !this.closed;
    }

    private refresh() {
        const elem = this.imageanchor.nativeElement as HTMLElement;
        elem.style.transform = this.transformM.transform;
    }

    onReset() {
        this.transformM.reset();
        this.refresh();
    }

    onPrev(event: MouseEvent) {
        event.stopPropagation();

        if(this.imageIndex > 0) {
            this.onReset();
            this.imageIndex--;
        }
    }

    onNext(event: MouseEvent) {
        event.stopPropagation();

        if(this.imageIndex < this.images.length - 1) {
            this.onReset();
            this.imageIndex++;
        }
    }

    move(x: number, y: number) {
        this.transformM.move(x, y);
        this.refresh();
    }

    moveUnit(x: number, y: number) {
        const elem = this.imageanchor.nativeElement as HTMLElement;
        x *= this.scale * elem.clientWidth  / 10;
        y *= this.scale * elem.clientHeight / 10;

        this.move(x, y);
    }

    private scale: number = 1;
    onScaleUp() {
        if(this.scale >= 10) return;
        const prev_scale = this.scale;
        this.scale += 0.1;

        this.transformM.scaleAt(this.scale / prev_scale, [0,0]);
        this.refresh();
    }

    onScaleDown() {
        if(this.scale <= 0.2) return;
        const prev_scale = this.scale;
        this.scale -= 0.1;

        this.transformM.scaleAt(this.scale / prev_scale, [0,0]);
        this.refresh();
    }

    private od = 0;
    rotate(deg: number) {
        deg = Math.floor(deg);
        this.od += deg;
        this.od %= 360;

        this.transformM.rotateAt(deg, [0,0]);

        const off = this.transformM.offset;
        if(this.od % 90 == 0 && Math.abs(deg) == 90 && Math.abs(off[0]) < 1e-2 && Math.abs(off[1]) < 1e-2) {
            const elem = this.imageanchor.nativeElement as HTMLElement;
            const elemx = this.imagex.nativeElement as HTMLElement;
            const r1 = elem.clientHeight / elemx.clientWidth;
            const r2 = elem.clientWidth / elemx.clientHeight;
            const ratio = Math.max(r1, r2);

            if(this.od % 180 == 0) {
                this.transformM.scaleAt(ratio, [0,0]);
            } else {
                this.transformM.scaleAt(1 / ratio, [0,0]);
            }
        }
        this.refresh();
    }
    onRotateLeft() {
        this.rotate(90);
    }

    onRotateRight() {
        this.rotate(-90);
    }
}

