
export class ViewTrait {
    public perform(host: HTMLElement) {
        throw new Error('view trait not implemented');
    }

    public afterViewInitHook() {}
    public destroyHook() {}
}

