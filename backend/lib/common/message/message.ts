/** define message for client and server communication */
import * as utils from '../utils';


let hasSharedArrayBuffer = true;
try {
    SharedArrayBuffer;
} catch {
    hasSharedArrayBuffer = false;
}

export enum MessageType {
    UserManagement = "USER_MANAGEMENT",
    FileManagement = "FILE_MANAGEMENT",
    MiscManagement = "MISC_MANAGEMENT",
    Uninit         = "UNINIT"
}
export type MessageId  = number;
export type MessageAck = number;

export enum MessageSource {
    Event    = "Event",
    Request  = "Request",
    Response = "Response"
}

export class BasicMessage {
    public accessToken: string;
    public messageSource: MessageSource = MessageSource.Request;
    public messageType: MessageType = MessageType.Uninit;
    public messageId:   MessageId   = -1;
    public messageAck:  MessageAck  = -1;
    public error: string | null     = null;
}

export class MessageEncoder {
    encode(msg: BasicMessage): string | ArrayBuffer {throw new Error("not implement"); return '';  }
    decode(msg: string | ArrayBuffer): BasicMessage {throw new Error("not implement"); return null;}
}

export class MessageJSON extends MessageEncoder {
    encode(msg: BasicMessage): string {
        return JSON.stringify(msg, null, 2);
    }

    decode(msg: string): BasicMessage {
        try {
            const o = JSON.parse(msg);
            for (let key in new BasicMessage()) {
                if (o[key] === undefined) {
                    return null;
                }
            }
            return o;
        } catch (err) {
            console.warn('bad JSON message');
            return null;
        }
    }
}

/** serialize an object
 * keyLength utf8(key) valueType valueLength utf(value)
 */
enum ValueType {
    NULL      = 1,
    BOOLEAN   = 2,
    NUMBER    = 3,
    STRING    = 4,
    OBJECT    = 5,
    ARRAY     = 6,
    BUFFERARRAY = 7
}
export class BINSerialization {
    private MergeArrayBuffer(bufs: ArrayBuffer[]): ArrayBuffer //{
    {
        let n = 0;
        for(let b of bufs) n += b.byteLength;
        let ans = new ArrayBuffer(n);
        let v = new DataView(ans);

        let i = 0;
        for(let b of bufs) {
            let bv = new DataView(b);
            for(let j=0;j<b.byteLength;j++) {
                v.setUint8(i++, bv.getUint8(j));
            }
        }

        return ans;
    } //}
    private MergeArray(a1: any[], a2: any[]): void //{
    {
        for(let o of a2) a1.push(o);
    } //}
    private viewToArrayBuffer(view: DataView): ArrayBuffer //{
    {
        let ans = new ArrayBuffer(view.byteLength);
        let va = new DataView(ans);
        for(let i=0;i<ans.byteLength;i++) {
            va.setUint8(i, view.getUint8(i));
        }
        return ans;
    } //}

    private type_encode_handler(t: ValueType): ArrayBuffer //{
    {
        let ans = new ArrayBuffer(1);
        let v = new DataView(ans);
        v.setUint8(0, t);
        return ans;
    } //}
    private type_decode_handler(view: DataView): ValueType //{
    {
        return view.getUint8(0);
    } //}

    private encode_length(len: number): ArrayBuffer[] //{
    {
        let ans: ArrayBuffer[] = [];

        if(len < 0xfe) {
            let n = new Uint8Array(1);
            n[0] = len;
            ans.push(n.buffer);
        } else if (len <= 0xffff) {
            let n = new Uint8Array(1);
            n[0] = 0xfe;
            ans.push(n.buffer);
            let n16 = new ArrayBuffer(2);
            let n16v = new DataView(n16);
            n16v.setUint16(0, len, false);
            ans.push(n16);
        } else if (len <= 0xffffffff) {
            let n = new Uint8Array(1);
            n[0] = 0xff;
            ans.push(n.buffer);
            let n32 = new ArrayBuffer(4);
            let n32v = new DataView(n32);
            n32v.setUint32(0, len, false);
            ans.push(n32);
        } else {
            throw new Error('string is too long');
        }

        return ans;
    } //}
    private decode_length(view: DataView): [number, number] //{
    {
        if(view.byteLength < 1) throw new Error('bad dataview for string');
        let total = 0;
        let ans = null;
        const l1 = view.getUint8(0);
        total++;
        view = new DataView(view.buffer, view.byteOffset + 1, view.byteLength -1);

        if(l1 < 0xfe) {
            ans = l1;
        } else if (l1 == 0xfe) {
            const l2 = view.getUint16(0, false);
            total += 2;
            ans = l2;
        } else {
            const l2 = view.getUint32(0, false);
            total += 4;
            ans = l2;
        }

        return [ans, total];
    } //}

    private string_encode_handler(str: string): ArrayBuffer[] //{
    {
        let encoder = utils.getTextEncoder();
        const f = encoder.encode(str);
        let ans: ArrayBuffer[] = this.encode_length(f.byteLength);
        ans.push(f.buffer);
        return ans;
    } //}
    private string_decode_handler(view: DataView): [string, number] //{
    {
        const [str_len, consumed] = this.decode_length(view);
        const str_view = new DataView(view.buffer, view.byteOffset + consumed, str_len);
        const ans = utils.getTextDecoder().decode(str_view);
        return [ans, str_len + consumed];
    } //}

    private number_encode_handler(n: number): ArrayBuffer //{
    {
        let b = new Float64Array(1);
        let v = new DataView(b.buffer);
        v.setFloat64(0, n);
        return b.buffer;
    } //}
    private number_decode_handler(view: DataView): number //{
    {
        if(view.byteLength < 8) throw new Error('bad view for float64');
        return view.getFloat64(0);
    } //}

    private boolean_encode_handler(b: boolean): ArrayBuffer //{
    {
        let ans = new ArrayBuffer(1);
        let v = new DataView(ans);
        if(b) v.setUint8(0, 1);

        return ans;
    } //}
    private boolean_decode_handler(view: DataView): boolean //{
    {
        return (view.getUint8(0) == 0) ? false : true;
    } //}

    private buffer_encode_handler(buf: ArrayBuffer | SharedArrayBuffer): ArrayBuffer[] //{
    {
        const ans = this.encode_length(buf.byteLength);
        ans.push(buf);
        return ans;
    } //}
    private buffer_decode_handler(view: DataView): [DataView, number] //{
    {
        const [buf_len, consumed] = this.decode_length(view);
        view = new DataView(view.buffer, view.byteOffset + consumed, buf_len);
        return [view, buf_len + consumed]
    } //}

    private array_encode_handler(val: Array<any>): [ArrayBuffer[], number] //{
    {
        let len = 0;
        let kkk = [];
        for(let v of val) {
            const [bs, l] = this.general_encode_handler(v);
            len += l;
            kkk.push(bs);
        }
        let ans = this.encode_length(len);
        for(let o of ans) len += o.byteLength;
        for(let bs of kkk) {
            this.MergeArray(ans, bs);
        }
        return [ans, len];
    } //}
    private array_decode_handler(view: DataView): [Array<any>, number] //{
    {
        const [arr_len, consumed] = this.decode_length(view);
        let arr_view = new DataView(view.buffer, view.byteOffset + consumed, arr_len);
        let ans = [];
        while(arr_view.byteLength > 0) {
            let [v, l] = this.general_decode_handler(arr_view);
            ans.push(v);
            arr_view = new DataView(arr_view.buffer, arr_view.byteOffset + l, arr_view.byteLength - l);
        }
        return [ans, arr_len + consumed];
    } //}

    private getBuffer(v: any): ArrayBuffer | SharedArrayBuffer //{
    {
        if(v instanceof ArrayBuffer)       return v;
        if(hasSharedArrayBuffer && v instanceof SharedArrayBuffer) return v;

        let viewBuf = false;
        if(v instanceof Int8Array)         viewBuf = true;
        if(v instanceof Int16Array)        viewBuf = true;
        if(v instanceof Int32Array)        viewBuf = true;
        if(v instanceof Uint8Array)        viewBuf = true;
        if(v instanceof Uint8ClampedArray) viewBuf = true;
        if(v instanceof Uint16Array)       viewBuf = true;
        if(v instanceof Uint32Array)       viewBuf = true;
        if(v instanceof Float32Array)      viewBuf = true;
        if(v instanceof Float64Array)      viewBuf = true;
        /*
         if(v instanceof BigInt64Array)     viewBuf = true;
         if(v instanceof BigUint64Array)    viewBuf = true;
         */
        if(v instanceof DataView)          viewBuf = true;
        if(viewBuf) {
            let ans = new ArrayBuffer(v.byteLength);
            let ansview = new Uint8Array(ans);
            let vx  = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
            for(let i=0;i<ans.byteLength;i++) {
                ansview[i] = vx[i];
            }
            return ans;
        }

        return null;
    } //}

    private object_encode_handler(obj: Object): [ArrayBuffer[], number] //{
    {
        let len = 0;
        let seg = [];

        for(let prop in obj) {
            const ss = this.string_encode_handler(prop);
            for(let e of ss) len += e.byteLength;
            this.MergeArray(seg, ss);

            const v = obj[prop];
            const [vv, vl] = this.general_encode_handler(v);
            len += vl;
            this.MergeArray(seg, vv);
        }
        const obj_len = this.encode_length(len);
        for(let o of obj_len) len += o.byteLength;
        this.MergeArray(obj_len, seg);

        return [obj_len, len];
    } //}
    private object_decode_handler(view: DataView): [Object, number] //{
    {
        const [len, consumed] = this.decode_length(view);
        view = new DataView(view.buffer, view.byteOffset + consumed, len);

        let ans = {};
        while(view.byteLength > 0) {
            let [f, fl] = this.string_decode_handler(view);
            view = new  DataView(view.buffer, view.byteOffset + fl, view.byteLength - fl);

            let [v, vl] = this.general_decode_handler(view);
            view = new  DataView(view.buffer, view.byteOffset + vl, view.byteLength - vl);
            ans[f] = v;
        }

        return [ans, len+consumed];
    } //}

    private general_encode_handler(val: any): [ArrayBuffer[], number] //{
    {
        let ans = [];
        let len = 0;

        len++;
        if((typeof val) == 'string') {
            ans.push(this.type_encode_handler(ValueType.STRING));
            const ss = this.string_encode_handler(val);
            for(let e of ss) len += e.byteLength;
            this.MergeArray(ans, ss);
        } else if ((typeof val) == 'number') {
            ans.push(this.type_encode_handler(ValueType.NUMBER));
            const nn = this.number_encode_handler(val);
            len += nn.byteLength;
            ans.push(nn);
        } else if ((typeof val) == 'boolean') {
            ans.push(this.type_encode_handler(ValueType.BOOLEAN));
            const bb = this.boolean_encode_handler(val); 
            len += bb.byteLength;
            ans.push(bb);
        } else if ((typeof val) == 'undefined') {
            ans.push(this.type_encode_handler(ValueType.NULL));
        } else if ((typeof val) == 'object') {
            if(val instanceof String) {
                ans.push(this.type_encode_handler(ValueType.STRING));
                const ss = this.string_encode_handler(val.toString());
                for(let e of ss) len += e.byteLength;
                this.MergeArray(ans, ss);
            } else if (val === null) {
                ans.push(this.type_encode_handler(ValueType.NULL));
            } else if (Array.isArray(val)) {
                ans.push(this.type_encode_handler(ValueType.ARRAY));
                const [arrs, l] = this.array_encode_handler(val);
                this.MergeArray(ans, arrs);
                len += l;
            } else {
                let buf = this.getBuffer(val);
                if(buf) {
                    ans.push(this.type_encode_handler(ValueType.BUFFERARRAY));
                    const bbb = this.buffer_encode_handler(buf);
                    for(let e of bbb) len += e.byteLength;
                    this.MergeArray(ans, bbb);
                } else {
                    ans.push(this.type_encode_handler(ValueType.OBJECT));
                    const [bs, l] = this.object_encode_handler(val);
                    this.MergeArray(ans, bs);
                    len += l;
                }
            }
        } else {
            throw new Error('bad object to serialization');
        }

        return [ans, len];
    } //}
    private general_decode_handler(view: DataView): [any, number] //{
    {
        let ans;
        let len = 0;

        const t = this.type_decode_handler(view);
        view = new DataView(view.buffer, view.byteOffset + 1, view.byteLength - 1);
        len++;
        switch(t) {
            case ValueType.ARRAY:
                let l3 = 0;
                [ans, l3] = this.array_decode_handler(view);
                len += l3;
                break;
            case ValueType.BOOLEAN:
                ans = this.boolean_decode_handler(view);
                len++;
                break;
            case ValueType.BUFFERARRAY:
                let [v, l] = this.buffer_decode_handler(view);
                ans = this.viewToArrayBuffer(v);
                len += l;
                break;
            case ValueType.NULL:
                ans = null;
                break;
            case ValueType.NUMBER:
                ans = this.number_decode_handler(view);
                len += 8;
                break;
            case ValueType.OBJECT:
                let l1 = 0;
                [ans, l1] = this.object_decode_handler(view);
                len += l1;
                break;
            case ValueType.STRING:
                let l2 = 0;
                [ans, l2] = this.string_decode_handler(view);
                len += l2;
                break;
            default:
                throw new Error(`It seems this view isn't a arraybuffer which serialized by counterpart encoder of THIS decoder`);
        }

        return [ans, len];
    } //}

    encode(obj: any): ArrayBuffer //{
    {
        return this.MergeArrayBuffer(this.general_encode_handler(obj)[0]);
    } //}
    decode(view: DataView | ArrayBuffer | SharedArrayBuffer): any //{
    {
        if (view instanceof ArrayBuffer)       view = new DataView(view);
        if (hasSharedArrayBuffer && view instanceof SharedArrayBuffer) view = new DataView(view);
        return this.general_decode_handler(view as DataView)[0];
    } //}
}

export class MessageBIN extends MessageEncoder {
    private bin_encoder;

    constructor() {
        super();
        this.bin_encoder = new BINSerialization();
    }

    encode(msg: BasicMessage): ArrayBuffer //{
    {
        if(!(msg instanceof BasicMessage)) return null;
        return this.bin_encoder.encode(msg);
    } //}
    decode(ab: ArrayBuffer): BasicMessage //{
    {
        const obj = this.bin_encoder.decode(new DataView(ab));
        if(obj == null || (typeof obj != 'object')) return null;

        const ans = new BasicMessage();
        for(let prop in ans) {
            if(obj[prop] === undefined) return null;
        }

        utils.CopySourceEnumProp(obj, ans);
        return ans;
    } //}
}

