import { ElementRef, ComponentRef, OnInit, OnDestroy, AfterViewChecked, AfterContentChecked, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { nextTick } from '../../utils';
import { ViewTrait } from './trait/view-trait';

export class AbsoluteView implements AfterViewInit, OnDestroy {
    private ref: ComponentRef<AbsoluteView> = null;
    set componentRef(ref: ComponentRef<AbsoluteView>) {
        if(this.ref != null || ref == null) {
            throw new Error('bad bad component ref');
        }
        this.ref = ref;
    }

    protected elem:  HTMLElement;
    private traits: ViewTrait[];
    constructor(protected host: ElementRef, ...traits: ViewTrait[]) {
        this.elem = host.nativeElement as HTMLElement;
        const style = this.elem.style;
        style.position   = "absolute";
        this.traits = traits;

        for(const trait of this.traits) trait.perform(this.elem);
    }

    ngAfterViewInit(): void {
        for(const trait of this.traits) trait.afterViewInitHook();
    }

    ngOnDestroy(): void {
        for(const trait of this.traits) trait.destroyHook();
    }

    destroy() {
        nextTick(() => this.ref.destroy());
    }
}

