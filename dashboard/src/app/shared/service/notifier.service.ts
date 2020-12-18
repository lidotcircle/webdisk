import { Injectable } from '@angular/core';
import { NotifierComponent } from '../shared-component/notifier/notifier.component';
import { InjectViewService } from './inject-view.service';

class NotifierHandler {
    private view: NotifierComponent;
    constructor(view: NotifierComponent) {
        this.view = view;
    }

    async wait() {
        await this.view.waitTimeout();
        this.view.destroy();
    }
}

@Injectable({
    providedIn: 'root'
})
export class NotifierService {
    constructor(private injector: InjectViewService) {}

    create(data: {
        message: string,
        duration?: number
    }): NotifierHandler {
        const view = this.injector.inject(NotifierComponent, data);
        return new NotifierHandler(view);
    }
}

