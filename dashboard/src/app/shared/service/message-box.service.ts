import { Injectable } from '@angular/core';
import { MessageBoxButton, MessageBoxComponent, MessageBoxInput } from '../shared-component/message-box/message-box.component';
import { InjectedComponentHandler, InjectViewService } from './inject-view.service';

class MessageBoxHandler {
    private view: InjectedComponentHandler<MessageBoxComponent>;
    constructor(view: InjectedComponentHandler<MessageBoxComponent>) {
        this.view = view;
    }

    async wait() {
        const ans = await this.view.instance.waitClose();
        this.view.destroy();
        return ans;
    }
}

@Injectable({
    providedIn: 'root'
})
export class MessageBoxService {
    constructor(private injector: InjectViewService) {}

    create(data: {
        title?: string,
        message: string,
        inputs?:  MessageBoxInput[],
        buttons?: MessageBoxButton[],
    }): MessageBoxHandler {
        const view = this.injector.inject(MessageBoxComponent, data);
        return new MessageBoxHandler(view);
    }
}

