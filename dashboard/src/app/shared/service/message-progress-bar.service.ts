import { Injectable } from '@angular/core';
import { MessageProgressBarComponent } from '../shared-component/message-progress-bar/message-progress-bar.component';
import { InjectedComponentHandler, InjectViewService } from './inject-view.service';

interface IMessageProgressBarHandler {
    registerClose(hook: ()=>void);
    finish(): Promise<void>;
    stop(): Promise<void>;
    pushMessage(message: string);
}

class MessageProgressBarHandler implements IMessageProgressBarHandler {
    private close_handler;

    constructor(private view: InjectedComponentHandler<MessageProgressBarComponent>) {}
    async finish() {this.view.instance.finish(); this.view.destroy();}
    async stop() {this.view.instance.stop(); this.view.destroy();};
    onClose() {this.close_handler(); this.view.destroy();}

    registerClose(hook: ()=>void) {this.close_handler = hook;}
    pushMessage(message: string) {this.view.instance.pushMessage(message);}
}


@Injectable({
    providedIn: 'root'
})
export class MessageProgressBarService {
    constructor(private injector: InjectViewService) { }

    create(progressbar: {title: string}): IMessageProgressBarHandler {
        let tf = () => {console.assert(false);}
        const nh = () => tf();
        const component = this.injector.inject(MessageProgressBarComponent, progressbar, {close: nh});
        const ans = new MessageProgressBarHandler(component);
        tf = () => ans.onClose();

        return ans;
    }
}

