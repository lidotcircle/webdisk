import { Injectable } from '@angular/core';
import { NotifierButton, NotifierComponent, NotifierInput } from '../shared-component/notifier/notifier.component';
import { InjectViewService } from './inject-view.service';

class NotifierHandler {
    private view: NotifierComponent;
    constructor(view: NotifierComponent) {
        this.view = view;
    }

    async wait() {
        const ans = await this.view.waitClose();
        this.view.destroy();
        return ans;
    }
}

@Injectable({
    providedIn: 'root'
})
export class WindowNotifierService {
    constructor(private injector: InjectViewService) {}

    create(data: {
        title?: string,
        message: string,
        inputs?:  NotifierInput[],
        buttons?: NotifierButton[],
    }): NotifierHandler {
        const view = this.injector.inject(NotifierComponent, data);
        return new NotifierHandler(view);
    }
}

