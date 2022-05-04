import { AfterViewInit, Directive, ElementRef, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { MousePointerService } from '../service/mouse-pointer.service';


@Directive({
    selector: '[movable]',
})
export class MovableDirective implements OnInit, AfterViewInit {
    @Input()
    classes: string[];
    @Input()
    stopMoving: boolean;
    @Input()
    onlyEmit: boolean;
    @Output()
    delta: EventEmitter<{ x: number, y: number }> = new EventEmitter();

    private bounded: boolean;
    private centering: boolean;

    private draggableElements: HTMLElement[];
    private moving: Subscription;
    private startShift: { left: number, top: number } = { left: 0, top: 0 };
    private currentShift: { left: number, top: number } = null;
    private startCursorPosition: { x: number, y: number };
    private shiftBoundary: { leftMin: number, leftMax: number, topMin: number, topMax: number };
    constructor(private host: ElementRef, private mouseService: MousePointerService) {}

    ngOnInit(): void {
        const host = this.host.nativeElement as HTMLElement;
        this.bounded = host.hasAttribute('bounded');
        this.centering = host.hasAttribute('centering');
        if (!this.onlyEmit) {
            host.style.position = 'absolute';
        }

        this.draggableElements = [ host ];
        if (this.classes) {
            this.draggableElements.splice(0,1);
            for (const cls of this.classes) {
                const elem = host.querySelector('.' + cls);
                if (elem && elem instanceof HTMLElement && 
                    this.draggableElements.indexOf(elem) < 0)
                {
                    this.draggableElements.push(elem);
                }
            }
        }

        const clickHandler = this.startMove.bind(this);
        this.draggableElements.forEach(elem => elem.addEventListener('mousedown', clickHandler));
        this.draggableElements.forEach(elem => elem.addEventListener('touchstart', clickHandler));
    }

    ngAfterViewInit(): void {
        if (this.onlyEmit) return;

        const host = this.host.nativeElement as HTMLElement;
        const mousePointer = this.mouseService.coordinate;
        const parent = this.getParentElement();
        if (this.centering) {
            host.style.top = `${(parent.clientHeight - host.clientHeight) / 2}px`;
            host.style.left = `${(parent.clientWidth - host.clientWidth) / 2}px`;
        } else if (mousePointer != null) {
            const p1 = Math.max(mousePointer[1] - host.clientHeight / 2, 0);
            const p2 = Math.max(mousePointer[0] - host.clientWidth / 2);
            const maxTop = parent.clientHeight - host.clientHeight;
            const maxLeft = parent.clientWidth - host.clientWidth;
            host.style.top = `${Math.min(p1, maxTop)}px`;
            host.style.left = `${Math.min(p2, maxLeft)}px`;
        } else {
            host.style.top = '50%';
            host.style.left = '50%';
        }
    }

    private getParentElement(): HTMLElement {
        const host = this.host.nativeElement as HTMLElement;
        let parent = host.parentNode as HTMLElement;
        while (parent.clientHeight == 0 && parent.clientWidth == 0 && parent != window.document.body) {
            parent = parent.parentNode as HTMLElement;
        }
        return parent;
    }

    private startMove(e: MouseEvent | TouchEvent) {
        if (this.stopMoving) return;

        if (this.moving) {
            this.stopMove();
        }

        if (this.bounded) {
            const host = this.host.nativeElement as HTMLElement;
            const parent = this.getParentElement();

            this.shiftBoundary = {
                leftMin: -host.offsetLeft,
                leftMax: parent.offsetWidth - host.offsetLeft - host.offsetWidth,
                topMin: -host.offsetTop,
                topMax: parent.offsetHeight - host.offsetTop - host.offsetHeight,
            }
        }

        if (e instanceof MouseEvent) {
            this.startCursorPosition = { x: e.clientX, y: e.clientY };
        } else if (e instanceof TouchEvent) {
            this.startCursorPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }

        this.moving = new Subscription();
        this.draggableElements.forEach(elem => {
            const originalCursor = elem.style.cursor;
            elem.style.cursor = 'move'
            this.moving.add(() => elem.style.cursor = originalCursor);
        });
    }

    @HostListener('document:touchmove', ['$event'])
    @HostListener("document:mousemove", ["$event"])
    move(event: MouseEvent | TouchEvent) {
        if (this.moving) {
            const delta = { x: 0, y: 0 };
            if (event instanceof MouseEvent) {
                delta.x = event.clientX - this.startCursorPosition.x,
                delta.y = event.clientY - this.startCursorPosition.y
            } else if (event instanceof TouchEvent) {
                delta.x = event.touches[0].clientX - this.startCursorPosition.x;
                delta.y = event.touches[0].clientY - this.startCursorPosition.y;
            }

            const oldShift = this.currentShift || this.startShift;
            this.currentShift = {
                left: this.startShift.left + delta.x,
                top: this.startShift.top + delta.y
            };
            if (this.bounded) {
                this.currentShift.left = Math.min(Math.max(this.currentShift.left, this.shiftBoundary.leftMin), this.shiftBoundary.leftMax);
                this.currentShift.top = Math.min(Math.max(this.currentShift.top, this.shiftBoundary.topMin), this.shiftBoundary.topMax);
            }

            const host = this.host.nativeElement as HTMLElement;
            if (!this.onlyEmit) {
                host.style.transform = `translate(${this.currentShift.left}px, ${this.currentShift.top}px)`;
            }

            const trueDelta = { x: this.currentShift.left - oldShift.left, y: this.currentShift.top - oldShift.top };
            if (trueDelta.x != 0 || trueDelta.y != 0) {
                this.delta.emit(trueDelta);
            }
        }
    }

    @HostListener('document:touchend')
    @HostListener("document:mouseup")
    stopMove() {
        if (!this.moving) return;

        if (this.currentShift) {
            this.startShift = this.currentShift;
            this.currentShift = null;
        }

        this.moving.unsubscribe();
        this.moving = null;
    }
}
