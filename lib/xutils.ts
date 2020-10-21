
export module validation {
    export function password(ps: string): boolean {
        return (ps.length >= 6);
    }

    const validName  = /^([A-Za-z]|\p{Unified_Ideograph})([A-Za-z0-9_]|\p{Unified_Ideograph}){2,}$/u;
    export function name(name: string): boolean {
        return validName.test(name);
    }
}


export function assignTargetEnumProp(src: Object, target: Object) {
    for(const prop in target)
        target[prop] = src[prop] || target[prop];
}

export function CopySourceEnumProp(src: Object, target: Object) {
    for(const prop in src)
        target[prop] = src[prop];
}

export function makeid(length: number): string
{
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghipqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ )
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    return result;
}

