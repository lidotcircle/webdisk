import { ElementRef, ComponentRef } from '@angular/core';
import { nextTick } from '../../utils';
import { ViewTrait } from './trait/view-trait';

export class AbsoluteView {
    private ref: ComponentRef<AbsoluteView> = null;
    set componentRef(ref: ComponentRef<AbsoluteView>) {
        if(this.ref != null || ref == null) {
            throw new Error('bad bad component ref');
        }
        this.ref = ref;
    }

    protected elem:  HTMLElement;
    constructor(protected host: ElementRef, ...traits: ViewTrait[]) {
        this.elem = host.nativeElement as HTMLElement;
        const style = this.elem.style;
        style.position   = "absolute";

        for(const trait of traits) trait.perform(this.elem);
    }

    destroy() {
        nextTick(() => this.ref.destroy());
    }
}
