import * as util from 'util';
export * from './copy_object';
import { assignTargetEnumProp } from './copy_object';

export function assert(val: boolean) {
    if(!val) throw new Error("assert fail");
}

export module validation {
    export function password(ps: string): boolean {
        return (ps.length >= 6);
    }

    const validName  = /^([A-Za-z]|\p{Unified_Ideograph})([A-Za-z0-9_]|\p{Unified_Ideograph}){2,}$/u;
    export function name(name: string): boolean {
        return validName.test(name);
    }
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
            case 'b':
                if(typeof argv[i] == 'boolean') {
                    continue;
                } else {
                    return false;
                }
            case 'n':
                if(typeof argv[i] == 'number') {
                    continue;
                } else {
                    return false;
                }
            case 's':
                if(typeof argv[i] == 'string') {
                    continue;
                } else {
                    return false;
                }
            case 'o':
                if(typeof argv[i] == 'object') {
                    continue;
                } else {
                    return false;
                }
            case 'a':
                if(typeof argv[i] == 'object' && Array.isArray(argv[i])) {
                    continue;
                } else {
                    return false;
                }
            case 'f':
                if(argv[i] instanceof ArrayBuffer) {
                    continue;
                } else {
                    return false;
                }
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

let hasSharedArrayBuffer = true;
try {
    SharedArrayBuffer;
} catch {
    hasSharedArrayBuffer = false;
}
declare const Buffer: any;
let hasBuffer = true;
try {
    Buffer;
} catch {
    hasBuffer = false;
}

export function isArrayBuffer(buf: any) {
    return (
        buf instanceof ArrayBuffer       ||
        (hasSharedArrayBuffer && buf instanceof SharedArrayBuffer) ||
        (hasBuffer && buf instanceof Buffer) ||
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

export type TypeOfClassProperty<T, M extends keyof T> = T[M];
export type TypeOfClassMethod  <T, M extends keyof T> = T[M] extends (...args: any) => any ? T[M] : never;
export function ForwardMethod(...keys: string[]) {
    return function (
        target: any,
        propertyKey: string) {
        return {
            writable: false,
            value: function (...args) {
                let n = this;
                let p = null;
                for(const k of keys) {
                    p = n;
                    n = p[k];
                }
                let f = n as Function;
                return f.bind(p)(...args);
            },
            configurable: false,
            enumerable: false
        } as any;
    }
}

function ForwardGetterSetterProperty(getter: boolean, setter: boolean, ...keys: string[]) {
    return function (
        target: any,
        propertyKey: string) {
        let ans = {
            configurable: false,
            enumerable: true
        };
        if (getter) {
            ans["get"] = function() {
                let n = this;
                for(const k of keys) n = n[k];
                return n;
            };
        }
        if (setter) {
            ans["set"] = function(val: any) {
                const k2 = keys.slice(0, keys.length-1);
                const idx = keys[keys.length - 1];
                let n = this;
                for(const k of k2) n = n[k];
                n[idx] = val;
            }
        }

        return ans as any;
    }
}

export function ForwardProperty(...keys: string[]) {
    return ForwardGetterSetterProperty(true, true, ...keys);
}

export function ForwardGetterProperty(...keys: string[]) {
    return ForwardGetterSetterProperty(true, false, ...keys);
}

export function ForwardSetterProperty(...keys: string[]) {
    return ForwardGetterSetterProperty(false, true, ...keys);
}

export function toInstanceOfType<T extends {new(): {}}>(constructor: T, origin: Object) {
    if(origin == null) return origin;
    let ans = new constructor();
    assignTargetEnumProp(origin, ans);
    return ans;
}

export module path {
    export function basename(filename): string {
        if(!filename) return null;
        let k = filename;
        if(k.endsWith('/') || k.endsWith('\\')) k = k.substr(0, k.length -1);
        const kk = k.split('/');
        return kk[kk.length - 1];
    }

    export function dir(filename: string): string {
        if(filename.endsWith('/')) {
            filename = filename.substr(0, filename.length - 1);
        }
        const n = filename.split('/');
        n.pop();
        return n.join('/');
    }

    export function extension(filename: string): string {
        if(!filename || filename.endsWith('/')) return '';
        const k = basename(filename).split('.');
        if(k.length == 1) return '';
        return k[k.length-1];
    }

    export function pathjoin(...pp: string[]): string {
        let res = [];
        for(let p of pp) {
            p = p.trim();
            if (p.endsWith('/'))
                p = p.substring(0, p.length - 1);
            res.push(p);
        }
        return res.join("/");
    }
}

export module cons {
    export const ServerName = 'webdisk/0.0.1';
    export const DiskPrefix = '/disk';
    export const NamedLinkPREFIX = "/link";
    export const DownloadTokenName = 'token';
    export const DownloadShortTermTokenName = 'stoken';
    export const ShortTermTokenValidPeriod = 2 * 60 * 60 * 1000;
}

const durUnitMap = new Map<string, number> //{
([ 
    ['ms', 1],

    ['s', 1000],
    ['second', 1000],
    ['seconds', 1000],

    ['min', 1000 * 60],
    ['mins', 1000 * 60],
    ['minite', 1000 * 60],
    ['minites', 1000 * 60],

    ['h', 1000 * 60 * 60],
    ['hour', 1000 * 60 * 60],
    ['hours', 1000 * 60 * 60],

    ['d', 1000 * 60 * 60 * 24],
    ['day', 1000 * 60 * 60 * 24],
    ['days', 1000 * 60 * 60 * 24],

    ['month', 1000 * 60 * 60 * 24 * 30],

    ['y', 1000 * 60 * 60 * 24 * 365],
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['years', 1000 * 60 * 60 * 24 * 365]
]); //}
export function duration2ms(dur: string): number //{
{
    dur = dur || '0s';
    dur = dur.trim();
    let ans = parseFloat(dur);
    if (isNaN(ans) || ans <= 0) {
        return 0;
    }
    let unit = '';
    for(let i=1;i<dur.length;i++) {
        const n = dur.substr(0, i);
        const v = parseFloat(n);
        if (v == ans) {
            unit = dur.substr(i);
            break;
        }
    }
    const u = durUnitMap.get(unit) || 0;
    return Math.floor(u * ans);
} //}

