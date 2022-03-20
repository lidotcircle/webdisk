

export function assignTargetEnumProp(src: Object, target: Object) {
    for(const prop in target) {
        if(src[prop] !== undefined)
            target[prop] = src[prop];
    }
}

export function CopySourceEnumProp(src: Object, target: Object) {
    for(const prop in src)
        target[prop] = src[prop];
}

function defineGetter(target: Object, prop: string, val: any) {
    Object.defineProperty(target, prop, {
        get: () => val,
        set: () => {throw new Error('change value of a readonly object is prohibited')},
        enumerable: true,
    });
}

export function CopySourcePropertiesAsGetter(src: Object, target: Object) {
    for(const prop in src) {
        if(typeof src[prop] === 'object') {
            const obj = {};
            CopySourcePropertiesAsGetter(src[prop], obj);
            defineGetter(target, prop, obj);
        } else {
            defineGetter(target, prop, src[prop]);
        }
    }
}

