
export class SoleWindowClickClose {
    private is_exit = false;
    private exit_cb: Function = null;
    async wait(): Promise<void> {
        if(this.is_exit) return;
        if(this.exit_cb) throw new Error();

        return new Promise((resolve) => {
            this.exit_cb = resolve;
        });
    }

    onexit(){
        this.is_exit = true;
        if(this.exit_cb) {
            this.exit_cb();
            this.exit_cb = null;
        }
    }
}

