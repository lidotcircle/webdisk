
/**
 * class decorator
 */ 
export function Forward2Member(memberName: string) {
    return function<T extends { new (...args: any[]): {}}>(constructor: T) {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);
                const special = this[memberName];

                return new Proxy(this, {
                    get: function (target, prop, receiver) {
                        const ans = Reflect.get(target, prop, receiver);
                        if (ans !== undefined) { return ans; }

                        if (special) return Reflect.get(special, prop);
                    },
                    set: function (target, prop, value, receiver) {
                        Reflect.set(target, prop, value, receiver);
                        return true;
                    }
                });
            }
        }
    }
}

