/** define message for client and server communication */
import * as utils from './utils';


export enum MessageType {
    UserManagement = "USER_MANAGEMENT",
    FileManagement = "FILE_MANAGEMENT",
    Uninit         = "UNINIT"
}
export type MessageId  = number;
export type MessageAck = number;

export class BasicMessage {
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
export class MessageBIN extends MessageEncoder {
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

    private string_encode_handler(str: string): ArrayBuffer[] //{
    {
        let encoder = utils.getTextEncoder();
        const f = encoder.encode(str);
        let n = new ArrayBuffer(4);
        const l = new DataView(n);
        l.setUint32(0, f.byteLength);
        return [n, f.buffer];
    } //}
    private string_decode_handler(view: DataView): [string, number] //{
    {
        if(view.byteLength < 4) throw new Error('bad dataview for string');
        const l = view.getUint32(0);
        const nv = new DataView(view.buffer, view.byteOffset + 4, l);
        const d = utils.getTextDecoder();
        const ans = d.decode(nv);
        return [ans, l + 4];
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
        let ll = new ArrayBuffer(4);
        let llv = new DataView(ll);
        llv.setUint32(0, buf.byteLength);
        return [ll, buf];
    } //}
    private buffer_decode_handler(view: DataView): [DataView, number] //{
    {
        if(view.byteLength < 4) throw new Error('bad view');
        const l = view.getUint32(0);
        if(view.byteLength < (4 + l)) throw new Error('bad view');
        view = new DataView(view.buffer, view.byteOffset + 4, l);
        return [view, l + 4]
    } //}

    private getBuffer(v: any): ArrayBuffer | SharedArrayBuffer //{
    {
        if(v instanceof ArrayBuffer)       return v;
        if(v instanceof SharedArrayBuffer) return v;

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
        if(v instanceof BigInt64Array)     viewBuf = true;
        if(v instanceof BigUint64Array)    viewBuf = true;
        if(v instanceof DataView)          viewBuf = true;
        if(viewBuf) {
            let ans = new ArrayBuffer(v.byteLength);
            let ansview = new Uint8Array(ans);
            let vview = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
            for(let i=0;i<ans.byteLength;i++) {
                ansview[i] = vview[i]
            }
            return ans;
        }

        return null;
    } //}

    private object_encode_handler(obj: Object): [number, ArrayBuffer[]] //{
    {
        let len = 0;
        let seg = [];

        for(let prop in obj) {
            const ss = this.string_encode_handler(prop);
            for(let e of ss) len += e.byteLength;
            this.MergeArray(seg, ss);

            const v = obj[prop];
            const [vl, vv] = this.general_encode_handler(v);
            len += vl;
            this.MergeArray(seg, vv);
        }

        return [len, seg];
    } //}
    private object_decode_handler(view: DataView): [Object, number] //{
    {
        if(view.byteLength < 4) throw new Error('bad view for object');
        let len = view.getUint32(0);
        if(view.byteLength < (4 + len)) throw new Error('bad view for object');
        view = new DataView(view.buffer, view.byteOffset + 4, len);

        let ans = {};
        while(view.byteLength > 0) {
            let [f, fl] = this.string_decode_handler(view);
            view = new  DataView(view.buffer, view.byteOffset + fl, view.byteLength - fl);

            let [vl, v] = this.general_decode_handler(view);
            view = new  DataView(view.buffer, view.byteOffset + vl, view.byteLength - vl);
            ans[f] = v;
        }

        return [ans, len+4];
    } //}

    private general_encode_handler(val: any): [number, ArrayBuffer[]] //{
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
                /*
                } else if (Array.isArray(val)) {
                    ans.push(this.type_encode_handler(ValueType.ARRAY));
                    let arr_len = 0;
                    let arr_ans = [];
                    for(let ve of val) {
                    }
                 */
            } else {
                let buf = this.getBuffer(val);
                if(buf) {
                    ans.push(this.type_encode_handler(ValueType.BUFFERARRAY));
                    const bbb = this.buffer_encode_handler(buf);
                    for(let e of bbb) len += e.byteLength;
                    this.MergeArray(ans, bbb);
                } else {
                    ans.push(this.type_encode_handler(ValueType.OBJECT));
                    const [l, bs] = this.object_encode_handler(val);
                    let ll = new ArrayBuffer(4);
                    let llv = new DataView(ll);
                    llv.setUint32(0, l);
                    ans.push(ll);
                    this.MergeArray(ans, bs);
                    len += 4;
                    len += l;
                }
            }
        } else {
            throw new Error('bad object to serialization');
        }

        return [len, ans];
    } //}
    private general_decode_handler(view: DataView): [number, any] //{
    {
        let ans;
        let len = 0;

        const t = this.type_decode_handler(view);
        view = new DataView(view.buffer, view.byteOffset + 1, view.byteLength - 1);
        len++;
        switch(t) {
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

        return [len, ans];
    } //}

    private encode__xx(obj: Object): ArrayBuffer //{
    {
        return this.MergeArrayBuffer(this.general_encode_handler(obj)[1]);
    } //}
    private decode__xx(view: DataView): Object //{
    {
        let t = this.type_decode_handler(view);
        if(t != ValueType.OBJECT) return null;
        return this.general_decode_handler(view)[1];
    } //}

    encode(msg: BasicMessage): ArrayBuffer //{
    {
        if(!(msg instanceof BasicMessage)) return null;
        return this.encode__xx(msg);
    } //}
    decode(ab: ArrayBuffer): BasicMessage //{
    {
        const obj = this.decode__xx(new DataView(ab));
        if(obj == null) return null;

        const ans = new BasicMessage();
        for(let prop in ans) {
            if(obj[prop] === undefined) return null;
        }

        utils.CopySourceEnumProp(obj, ans);
        return ans;
    } //}
}

