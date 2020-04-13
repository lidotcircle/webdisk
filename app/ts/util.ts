/** utils */

function getCaller () //{
{
    let reg = /\s+at (\S+)( \(([^)]+)\))?/g;
    let ee: string;
    try {throw new Error();}
    catch (e) {ee = e.stack;}
    reg.exec(ee);
    reg.exec(ee);
    let mm = reg.exec(ee);
    if (!mm) return null;
    return [mm[3] || "", mm[1]];
}; //}

export function debug(...argv) //{
{
    let caller = getCaller();
    let msg = "debug message";
    msg = caller ? `[${caller[1]} (${caller[0]})]: ` : `[${msg}]: `;
    console.debug(msg, ...argv);
} //}

export function dirname(path: string): string //{
{
    let sep = path.lastIndexOf("/");
    if(sep  < 0) return null;
    if(sep == 0) return '/';
    return path.substring(0, sep);
} //}

export function basename(path: string): string //{
{
    let sep = path.lastIndexOf("/");
    if(sep < 0) return path;
    if (sep + 1 == path.length) return "";
    return path.substring(sep + 1);
} //}

export function extension(path: string): string //{
{
    let sep = path.lastIndexOf(".");
    if (sep < 0) return null;
    if (sep == path.length - 1) return "";
    return path.substring(sep + 1);
} //}

export function createNodeFromHtmlString(htmlText: string): HTMLElement //{
{
    let div = document.createElement("div");
    div.innerHTML = htmlText.trim();
    return div.firstChild as HTMLElement;
} //}

export function makeid(length: number): string //{
{
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghipqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ )
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    return result;
} //}

/**
 * convert between hex data and buffer
 * @exception {Error} when meeting bad encoding of hex data will throw exception
 */
let HEX_MAP = "0123456789ABCDEF";
let REV_HEX_MAP = {
    '0': 0,  '1':  1, '2': 2,  '3':  3,
    '4': 4,  '5':  5, '6': 6,  '7':  7,
    '8': 8,  '9':  9, 'A': 10, 'B': 11,
    'C': 12, 'D': 13, 'E': 14, 'F': 15,
    'a': 10, 'b': 11, 'c': 12, 'd': 13,
    'e': 14, 'f': 15
};
export function BufferToHex(buf: ArrayBuffer): string //{
{
    let ret = [];
    let u8buf: Uint8Array = new Uint8Array(buf);
    for(let i = 0; i < u8buf.length; i++) {
        let c = u8buf[i];
        let c1 = c & 0xF0;
        let c2 = c & 0xFF;
        ret.push(HEX_MAP[c1]);
        ret.push(HEX_MAP[c2]);
    }
    return ret.join("");
} //}
export function HexToBuffer(hex: string): ArrayBuffer //{
{
    if (hex.length % 2 != 0) throw new Error("bad encode");
    let ret = new Uint8Array(hex.length / 2);
    for(let i = 0; i<ret.length; i++) {
        let x1 = REV_HEX_MAP[hex.charAt( 2 * i )];
        let x2 = REV_HEX_MAP[hex.charAt( 2 * i + 1)];
        if (x1 == null || x2 == null)
            throw new Error("bad encode");
        ret[i] = x1 | x2;
    }
    return ret;
} //}

export function promisify(original) //{
{
    if (typeof original !== 'function')
        throw new Error('type-error');
    function fn(...args) {
        return new Promise((resolve, reject) => {
            original.call(this, ...args, (err, ...values) => {
                if (err) {
                    return reject(err);
                }
                if(values && values.length > 0) resolve(values);
                resolve();
            });
        });
    }
    return fn;
} //}

export function parseCookie(cookie: string): Map<string, string> //{
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
} //}

