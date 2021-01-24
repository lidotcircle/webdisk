import { Injectable } from '@angular/core';
import { NotifierComponent, NotifierType } from '../shared-component/notifier/notifier.component';
import { InjectedComponentHandler, InjectViewService } from './inject-view.service';

const viewrefindex = Symbol('viewindex');
let viewindexcount = 0;
const notifierviews: InjectedComponentHandler<NotifierComponent>[] = [];

class NotifierHandler {
    private view: InjectedComponentHandler<NotifierComponent>;
    constructor(view: InjectedComponentHandler<NotifierComponent>) {
        this.view = view;
    }

    async wait() {
        await this.view.instance.waitTimeout();
        this.view.destroy();

        const ind: number = this.view[viewrefindex];
        delete notifierviews[ind];
    }
}

@Injectable({
    providedIn: 'root'
})
export class NotifierService {
    constructor(private injector: InjectViewService) {}

    create(data: {
        message: string,
        duration?: number,
        mtype?: NotifierType
    }): NotifierHandler {
        const view = this.injector.inject(NotifierComponent, data);
        view[viewrefindex] = viewindexcount++;
        notifierviews.push(view);
        view.instance.viewinit().then(() => {
            const mvpx = view.instance.height;

            for(const vi in notifierviews) {
                const v = notifierviews[vi];
                if(v != view) {
                    v.instance.upup(mvpx);
                }
            }
        });
        return new NotifierHandler(view);
    }
}

