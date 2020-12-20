import { Injectable, ComponentFactoryResolver, Component, Type, ViewContainerRef, ApplicationRef, ComponentRef, EventEmitter } from '@angular/core';
import { AppComponent } from 'src/app/app.component';
import { AbsoluteView } from '../shared-component/absolute-view/absolute-view';
import { rootViewContainerRefSymbol, CopySourceEnumProp } from '../utils';

@Injectable({
    providedIn: 'root'
})
export class InjectViewService {
    private body: HTMLElement;
    private bodyContainer: ViewContainerRef;
    constructor(private resolver: ComponentFactoryResolver,
                private appRef: ApplicationRef) {
        this.body = document.body;
        this.bodyContainer = window[rootViewContainerRefSymbol];
    }

    inject<T extends AbsoluteView>(component: Type<T>, inputs: {[key: string]: any} = {}, events?: {[key: string]: (v?:any) => void}): T {
        const factory = this.resolver.resolveComponentFactory(component);
        const ref = this.bodyContainer.createComponent(factory);
        CopySourceEnumProp(inputs, ref.instance);

        if(events) {
            for(const event in events) {
                const emitter = ref.instance[event] as EventEmitter<any>;
                const cb = events[event];
                emitter.subscribe(v => cb(v));
            }
        }

        ref.instance.componentRef = ref;
        return ref.instance;
    }
}

