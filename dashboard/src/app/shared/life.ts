
type lifeEndHook = () => void;

export class Life {
    private _hooks: lifeEndHook[];

    constructor() {this._hooks = [];}

    onend(hook: lifeEndHook) {
        this._hooks.push(hook);
    }

    die() {
        for(const hook of this._hooks) {
            try {
                hook.bind(null)();
            } catch {}
        }
    }
}

