import { Component, Input, OnInit, ViewContainerRef, Type, ComponentFactoryResolver, EventEmitter, ComponentRef, ViewChild } from '@angular/core';


@Component({
    selector: 'app-snwindow-inner',
    template: `<span></span>`,
    styleUrls: []
})
export class SNWindowInnerComponent implements OnInit {
    @Input()
    private componentType: Type<OnInit>;
    @Input()
    private inputs: {[key: string]: any};
    @Input()
    private events?: {[key: string]: (v?:any) => void};
    private componentRef: ComponentRef<any>;

    constructor(private containerRef: ViewContainerRef,
                private resolver: ComponentFactoryResolver) {}

    ngOnInit(): void
    {
        const factory = this.resolver.resolveComponentFactory(this.componentType);
        this.componentRef = this.containerRef.createComponent(factory);
        const subcomp = this.componentRef.instance;
        if (this.inputs != null && this.inputs instanceof Object) {
            
            for (const key of Object.getOwnPropertyNames(this.inputs)) {
                const val = this.inputs[key];
                subcomp[key] = val;
            }
        }

        if(this.events && this.events instanceof Object) {
            for(const event of Object.getOwnPropertyNames(this.events)) {
                const emitter = subcomp[event] as EventEmitter<any>;
                const cb = this.events[event];
                emitter.subscribe(v => cb(v));
            }
        }
    }

    get instance() {
        if (!this.componentRef) {
            return null;
        } else {
            return this.componentRef.instance;
        }
    }
}


@Component({
    selector: 'app-snwindow',
    template: `
    <div class="snwindow">
      <app-snwindow-inner [inputs]='inputs' [componentType]='componentType' [events]='events'>
      </app-snwindow-inner>
    </div>
    `,
    styleUrls: ['./snwindow.component.scss']
})
export class SNWindowComponent implements OnInit {
    @Input()
    componentType: Type<OnInit>;
    @Input()
    inputs: {[key: string]: any};
    @Input()
    events?: {[key: string]: (v?:any) => void};
    @ViewChild('app-snwindow-inner', {static: true})
    private inner: SNWindowInnerComponent;

    constructor() {}

    ngOnInit(): void {}
}
