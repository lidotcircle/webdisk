import { Injectable, ComponentFactoryResolver, Component, Type, ViewContainerRef, ApplicationRef, ComponentRef } from '@angular/core';
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

    inject<T extends AbsoluteView>(component: Type<T>, inputs: {[key: string]: any} = {}): T {
        const factory = this.resolver.resolveComponentFactory(component);
        const ref = this.bodyContainer.createComponent(factory);
        CopySourceEnumProp(inputs, ref.instance);
        ref.instance.componentRef = ref;
        return ref.instance;
    }
}

