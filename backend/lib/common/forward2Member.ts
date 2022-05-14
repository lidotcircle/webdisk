
/**
 * class decorator
 */ 
export function Forward2Member(memberName: string, protoLevel: number = 1) {
    return function<T extends { new (...args: any[]): {}}>(constructor: T) {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);
                const special = this[memberName];

                return new Proxy(this, {
                    get: function (target, prop, receiver) {
                        if (target.hasOwnProperty(prop)) {
                            return Reflect.get(target, prop, receiver);
                        }

                        let protox = (target as any).__proto__.__proto__;
                        let protol = protoLevel;
                        while (protol > 0) {
                            if (protox.hasOwnProperty(prop)) {
                                return Reflect.get(target, prop, receiver);
                            }
                            protol--;
                            protox = protox.__proto__;
                        }

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

