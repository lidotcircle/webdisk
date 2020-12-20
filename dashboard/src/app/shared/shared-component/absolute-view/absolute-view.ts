import { ElementRef, ComponentRef, OnInit, OnDestroy, AfterViewChecked, AfterContentChecked, OnChanges, SimpleChanges, AfterViewInit, Component } from '@angular/core';
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
    private traits: ViewTrait[];
    constructor(protected host: ElementRef, ...traits: ViewTrait[]) {
        this.elem = host.nativeElement as HTMLElement;
        const style = this.elem.style;
        style.position   = "absolute";
        this.traits = traits;

        for(const trait of this.traits) trait.perform(this.elem);
    }

    __ngAfterViewInit__(): void {
        for(const trait of this.traits) trait.afterViewInitHook();
    }

    __ngOnDestroy__(): void {
        for(const trait of this.traits) trait.destroyHook();
    }

    destroy() {
        nextTick(() => this.ref.destroy());
    }
}

interface AbsoluteViewPrototype {
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
}

function mergeMethod(obj: object, methodname: string, hook: ()=>void) {
    const m1 = obj[methodname];
    obj[methodname] = function () {
        if(m1) m1.bind(this)();
        hook.bind(this)();
    }
}

export function BeAbsoluteView() {
    return function <T extends {new(...args: any[]): {}}>(constructor: T) {
        mergeMethod(constructor.prototype, 'ngAfterViewInit', AbsoluteView.prototype.__ngAfterViewInit__);
        mergeMethod(constructor.prototype, 'ngOnDestroy',     AbsoluteView.prototype.__ngOnDestroy__);
    }
}

