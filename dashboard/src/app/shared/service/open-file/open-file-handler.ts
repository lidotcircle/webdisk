import { InjectedComponentHandler } from '../inject-view.service';

export class OpenFileHandler<T extends {wait(): Promise<any>;}> {
    private h: InjectedComponentHandler<T>;
    constructor(handler: InjectedComponentHandler<T>) {
        this.h = handler;
    }

    private destroyed: boolean = false;
    async wait(): Promise<void> {
        await this.h.instance.wait();

        if(!this.destroyed) {
            this.h.destroy();
            this.destroyed = true;
        }
    }
}

