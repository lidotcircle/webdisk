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

export function ObjectFreezeRecursively(obj: Object) {
    Object.freeze(obj);
    for (const key of Object.getOwnPropertyNames(obj)) {
        if (typeof obj[key] === 'object')
            ObjectFreezeRecursively(obj[key]);
    }
}
