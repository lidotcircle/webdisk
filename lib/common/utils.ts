import * as util from 'util';


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
    for(const prop in target) {
        if(src[prop] != null)
            target[prop] = src[prop];
    }
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

export function parseCookie(cookie: string): Map<string, string>
{
    cookie = cookie || "";
    let ret = new Map<string, string>();
    let s1 = cookie.split(";");
    for (let vv of s1) {
        let kv = vv.split("=");
        kv[1] = kv[1] || "true";
        ret.set(kv[0].trim(), kv[1].trim());
    }
    return ret;
}

let textEncoderDecoder = true;
try { new TextEncoder(); } catch (e) {textEncoderDecoder = false;}
declare var TextEncoder: (typeof util.TextEncoder);
declare var TextDecoder: (typeof util.TextDecoder);
export function getTextEncoder() {
    return textEncoderDecoder ? new TextEncoder() : new util.TextEncoder();
}
export function getTextDecoder() {
    return textEncoderDecoder ? new TextDecoder() : new util.TextDecoder();
}

