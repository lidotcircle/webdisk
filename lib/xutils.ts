

export function assignTargetEnumProp(src: Object, target: Object) {
    for(const prop in target)
        target[prop] = src[prop] || target[prop];
}

export function CopySourceEnumProp(src: Object, target: Object) {
    for(const prop in src)
        target[prop] = src[prop];
}


