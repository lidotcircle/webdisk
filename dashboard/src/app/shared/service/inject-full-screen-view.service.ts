import { Injectable, ComponentFactoryResolver, Component, Type, ViewContainerRef, ApplicationRef, ComponentRef } from '@angular/core';
import { FullScreenShadowComponent } from '../shared-component/full-screen-shadow/full-screen-shadow.component';
import { AppComponent } from 'src/app/app.component';
import { rootViewContainerRefSymbol, CopySourceEnumProp } from '../utils';

@Injectable({
    providedIn: 'root'
})
export class InjectFullScreenViewService {
    private body: HTMLElement;
    private bodyContainer: ViewContainerRef;
    constructor(private resolver: ComponentFactoryResolver,
                private appRef: ApplicationRef) {
        this.body = document.body;
        this.bodyContainer = window[rootViewContainerRefSymbol];
    }

    inject(component: Type<FullScreenShadowComponent>, inputs: {[key: string]: any} = {}): any {
        const factory = this.resolver.resolveComponentFactory(component);
        const ref = this.bodyContainer.createComponent(factory);
        CopySourceEnumProp(inputs, ref.instance);
        ref.instance.componentRef = ref;
        return ref.instance;
    }
}

