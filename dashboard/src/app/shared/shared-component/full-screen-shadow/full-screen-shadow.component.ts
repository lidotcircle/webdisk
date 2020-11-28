import { Component, OnInit, ElementRef, OnDestroy, ComponentRef } from '@angular/core';
import { nextTick } from '../../utils';

export class FullScreenShadowComponent {
    private ref: ComponentRef<FullScreenShadowComponent> = null;
    set componentRef(ref: ComponentRef<FullScreenShadowComponent>) {
        if(this.ref != null || ref == null) {
            throw new Error('bad bad component ref');
        }
        this.ref = ref;
    }

    constructor(protected host: ElementRef) {
        const style = (host.nativeElement as HTMLElement).style;
        style.position   = "absolute";
        style.background = "rgba(100, 100, 100, 0.3)";
        style.width      = "100%";
        style.height     = "100%";
        style.zIndex     = "100";
        style.top        = '0em';
        style.left       = '0em';
    }

    destroy() {
        nextTick(() => this.ref.destroy());
    }
}

