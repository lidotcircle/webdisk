import { Injectable, ComponentFactoryResolver, Component, Type, ViewContainerRef, ApplicationRef, ComponentRef, EventEmitter } from '@angular/core';
import { AppComponent } from 'src/app/app.component';
import { AbsoluteView } from '../shared-component/absolute-view/absolute-view';
import { rootViewContainerRefSymbol, CopySourceEnumProp, nextTick } from '../utils';

const componentRefSymbol = Symbol('componentRef');
export class InjectedComponentHandler<T> {
    private _instance: T;
    get instance() {return this._instance;}

    constructor(instance: T) {
        this._instance = instance;
    }

    destroy() {
        nextTick(() => {
            const ref = this._instance[componentRefSymbol] as ComponentRef<T>;
            ref.destroy();
        });
    }
}

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

    inject<T>(component: Type<T>, 
              inputs: {[key: string]: any} = {}, 
              events?: {[key: string]: (v?:any) => void}): InjectedComponentHandler<T> {
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

        ref.instance[componentRefSymbol] = ref;
        return new InjectedComponentHandler(ref.instance);
    }
}

