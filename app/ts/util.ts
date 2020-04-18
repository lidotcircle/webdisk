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

export function pathJoin(...pp: string[]): string //{
{
    let res = [];
    for(let p of pp) {
        p = p.trim();
        if (p.endsWith('/'))
            p = p.substring(0, p.length - 1);
        res.push(p);
    }
    return res.join("/");
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
        let c1 = (c & 0xF0) >> 4;
        let c2 = c & 0x0F;
        ret.push(HEX_MAP.charAt(c1));
        ret.push(HEX_MAP.charAt(c2));
    }
    return ret.join("");
} //}
export function HexToBuffer(hex: string): ArrayBuffer //{
{
    if (hex.length % 2 != 0) throw new Error("bad encode");
    let ret = new Uint8Array(hex.length / 2);
    for(let i = 0; i<ret.length; i++) {
        let x1 = REV_HEX_MAP[hex.charAt( 2 * i )] << 4;
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
                if(values && values.length > 0) resolve(...values);
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

/** encode string pair like http header format, append newline in last field-value pair.
 *  If the pairs is {}, then the result is '\n'
 */
export function EncodePairs(pairs: any): ArrayBuffer //{
{
    let s = "";
    for(let i in pairs)
        s += `${i}: ${encodeURI(pairs[i])}\n`;
    s += "\n";
    let x = new TextEncoder();
    return x.encode(s);
} //}

enum DecodeState {
    Begin,
    Field,
    Space,
    Value,
    NEWLINE,
    END
}
/** REGEXP ([^:]+:\s*[^\n]+\n)*\n.*
 * Begin (char=\n)=> End,   (otherwise)=> Field [field += char]
 * Field (char=:)=> Space,  (otherwise)=> Field [field += char]
 * Space (char= )=> Space,  (otherwise)=> Value [value += char]
 * Value (char=\n)=> NEWLINE [return[field]=value, field = "", value = ""], 
 *                          (otherwise)=> Value [value += char]
 * NEWLINE (char=\n)=> END, (otherwise)=> Value [value += char]
 * END
 */
/** decode string pair from buffer, reversed operation of above function.
 *  @exception {Error} If format error, raise an error
 */
export function DecodePairs(buf: ArrayBuffer): [any, ArrayBuffer] //{
{
    let x = new TextDecoder();
    let array = new Uint8Array(buf);
    let ret = {};
    let output = "";
    let field = "";
    let value = ""
    let state = DecodeState.Begin;
    let i;
    for(i=0; i<array.length; i++) //{
    {
        let y: string = x.decode(array.subarray(i, i+1));
        if (y == "") continue;
        switch (state) {
            case DecodeState.Begin:
                if (y == "\n") {
                    state = DecodeState.END;
                } else {
                    field += y;
                    state = DecodeState.Field;
                } break;
            case DecodeState.Field:
                if (y == ":") {
                    state = DecodeState.Space;
                } else {
                    field += y;
                } break;
            case DecodeState.Space:
                if( y != " " && y != "\t") {
                    state = DecodeState.Value;
                    value += y;
                } break;
            case DecodeState.Value:
                if (y == "\n") {
                    state = DecodeState.NEWLINE;
                    ret[field] = value;
                    field = "";
                    value = "";
                } else {
                    value += y;
                } break;
            case DecodeState.NEWLINE:
                if (y == "\n") {
                    state = DecodeState.END;
                } else {
                    state = DecodeState.Field;
                    field += y;
                } break;
        }
        if (state == DecodeState.END) break;
    } //}
    if (state != DecodeState.END) {
        throw new Error("bad format");
    }
    return [ret, array.subarray(i+1)];
} //}

/** @see https://gist.github.com/72lions/4528834#gistcomment-2657284
 * Creates a new ArrayBuffer from concatenating two existing ones
 *
 * @param {ArrayBuffer | null} buffer1 The first buffer.
 * @param {ArrayBuffer | null} buffer2 The second buffer.
 * @return {ArrayBuffer | null} The new ArrayBuffer created out of the two.
 */
export function concatArrayBuffers(buffer1, buffer2) //{
{
    if (!buffer1) {
        return buffer2;
    } else if (!buffer2) {
        return buffer1;
    }

    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
} //}

export class FileTree //{
{
    children: Map<string, (FileTree | File)>;
    filetree: boolean;
    name: string;

    constructor(name: string) {
        this.children = new Map<string, (FileTree | File)>();
        this.name = name;
        this.filetree = true;
    }

    private getA(path_: string): [string, string] {
        let i = path_.indexOf("/");
        if(i < 0) return [path_, null];
        return [path_.substring(0, i), path_.substring(i + 1)];
    }

    /**
     * @param {string} path_ path like a/b/c/d
     * @param {File} fileEntry file entry, external node of tree
     */
    add(path_: string, fileEntry: File) {
        let x, y;
        [x, y] = this.getA(path_);
        if(y == null)
            return this.children.set(path_, fileEntry);
        if(!this.children.has(x))
            this.children.set(x, new FileTree(x));
        return (this.children.get(x) as FileTree).add(y, fileEntry);
    }
} //}
export function DirectoryfileListToFileTree(cwd: string, fileList: File[]) //{
{
    let ret = new FileTree(cwd);
    for(let v of fileList)
        ret.add((v as any).webkitRelativePath, v);
    return ret;
} //}
export function MultiplefileListToFileTree(cwd: string, fileList: File[]) //{
{
    let ret = new FileTree(cwd);
    for(let v of fileList)
        ret.add(v.name, v);
    return ret;
} //}

