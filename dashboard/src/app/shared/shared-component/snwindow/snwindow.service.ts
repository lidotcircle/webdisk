import { Injectable, Type } from '@angular/core';
import { InjectViewService, InjectedComponentHandler } from '../../service/inject-view.service';
import { SNWindowComponent } from './snwindow.component';
import { SNWindowModule } from './snwindow.module';


export class WindowHandler {
    private _chandler: InjectedComponentHandler<SNWindowComponent>;

    constructor(handler: InjectedComponentHandler<SNWindowComponent>) {
        this._chandler = handler;
    }

    public component() { return this._chandler.instance; }
}


@Injectable({
    providedIn: SNWindowModule
})
export class SNWindowService{
    constructor(private injector: InjectViewService) {}

    public open<T>(component: Type<T>, 
              inputs: {[key: string]: any} = {}, 
              events?: {[key: string]: (v?:any) => void}): WindowHandler
    {
        const handler = this.injector.inject(SNWindowComponent, {
            componentType: component,
            inputs: inputs,
            events: events,
        });
        return new WindowHandler(handler);
    }
}
