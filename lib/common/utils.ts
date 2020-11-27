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

/**
 * pattern specify follow types: boolean, number, string, object, array, buffer
 *     for example 'bf', 'bn', 'ns'
 */
export function checkArgv(pattern: string, argv: any[]): boolean {
    if(!Array.isArray(argv) || pattern.length != argv.length) {
        return false;
    }
    for(let i=0;i<pattern.length;i++) {
        switch(pattern[i]) {
            case 'b': {
                if(typeof argv[i] == 'boolean') {
                    continue;
                } else {
                    return false;
                }
            } break;
            case 'n': {
                if(typeof argv[i] == 'number') {
                    continue;
                } else {
                    return false;
                }
            } break;
            case 's': {
                if(typeof argv[i] == 'string') {
                    continue;
                } else {
                    return false;
                }
            } break;
            case 'o': {
                if(typeof argv[i] == 'object') {
                    continue;
                } else {
                    return false;
                }
            } break;
            case 'a': {
                if(typeof argv[i] == 'object' && Array.isArray(argv[i])) {
                    continue;
                } else {
                    return false;
                }
            } break;
            case 'f': {
                if(argv[i] instanceof ArrayBuffer) {
                    continue;
                } else {
                    return false;
                }
            } break;
            default:
                return false;
        }
    }
    return true;
}

export function changeObject(obj: object, func: (prop: string, val: any) => any): object {
    if(typeof obj == 'object') {
        for(const prop in obj) {
            changeObject(obj[prop], func);
            obj[prop] = func(prop, obj[prop]);
        }
    }
    return obj;
}

export function subStringInObject(obj: object, propRegex: RegExp, srcRegex: RegExp | string, target: string): object {
    changeObject(obj, (prop, val) => {
        if(typeof val == 'string' && prop.match(propRegex)) {
            console.log(val.replace(srcRegex, target));
            return val.replace(srcRegex, target);
        } else {
            return val;
        }
    });
    return obj;
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

export function isArrayBuffer(buf: any) {
    return (
        buf instanceof ArrayBuffer       ||
        buf instanceof SharedArrayBuffer ||
        buf instanceof Int8Array         ||
        buf instanceof Int16Array        ||
        buf instanceof Int32Array        ||
        buf instanceof Uint8ClampedArray ||
        buf instanceof Uint16Array       ||
        buf instanceof Uint32Array       ||
        buf instanceof Float32Array      ||
        buf instanceof Float64Array      ||
        buf instanceof DataView);
}

export function hasArrayBuffer(obj: any) {
    if(isArrayBuffer(obj)) return true;
    if(typeof obj == 'object') {
        for(let prop in obj) {
            if(hasArrayBuffer(obj[prop])) {
                return true;
            }
        }
    }
    return false;
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

