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
    BUFFERARRAY = 6
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
            let bv = new DataView(((b instanceof ArrayBuffer) || (b instanceof SharedArrayBuffer)) ? b : b["buffer"]);
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

    private buffer_encode_handler(buf: any): ArrayBuffer[] //{
    {
        if(!this.isBuffer(buf)) throw new Error('fault');

        const b = this.isBuffer(buf);
        let ll = new ArrayBuffer(4);
        let llv = new DataView(ll);
        llv.setUint32(0, b.byteLength);
        return [ll, b];
    } //}
    private buffer_decode_handler(view: DataView): [DataView, number] //{
    {
        if(view.byteLength < 4) throw new Error('bad view');
        const l = view.getUint32(0);
        if(view.byteLength < (4 + l)) throw new Error('bad view');
        view = new DataView(view.buffer, view.byteOffset + 4, l);
        return [view, l + 4]
    } //}

    private isBuffer(v: any): ArrayBuffer | SharedArrayBuffer //{
    {
        if(v instanceof ArrayBuffer)       return v;
        if(v instanceof SharedArrayBuffer) return v;

        if(v instanceof Int8Array)         return v.buffer;
        if(v instanceof Int16Array)        return v.buffer;
        if(v instanceof Int32Array)        return v.buffer;
        if(v instanceof Uint8Array)        return v.buffer;
        if(v instanceof Uint8ClampedArray) return v.buffer;
        if(v instanceof Uint16Array)       return v.buffer;
        if(v instanceof Uint32Array)       return v.buffer;
        if(v instanceof Float32Array)      return v.buffer;
        if(v instanceof Float64Array)      return v.buffer;
        if(v instanceof BigInt64Array)     return v.buffer;
        if(v instanceof BigUint64Array)    return v.buffer;
        if(v instanceof DataView)          return v.buffer;

        return null;
    } //}

    private object_encode_handler(obj: Object): ArrayBuffer[] //{
    {
        let len = 0;
        let seg = [];

        for(let prop in obj) {
            this.MergeArray(seg, this.string_encode_handler(prop));

            const v = obj[prop];
            if((typeof v) == 'string') {
                seg.push(this.type_encode_handler(ValueType.STRING));
                this.MergeArray(seg, this.string_encode_handler(v));
            } else if ((typeof v) == 'number') {
                seg.push(this.type_encode_handler(ValueType.NUMBER));
                seg.push(this.number_encode_handler(v));
            } else if ((typeof v) == 'boolean') {
                seg.push(this.type_encode_handler(ValueType.BOOLEAN));
                seg.push(this.boolean_encode_handler(v));
            } else if ((typeof v) == 'undefined') {
                seg.push(this.type_encode_handler(ValueType.NULL));
            } else if ((typeof v) == 'object') {
                if(v instanceof String) {
                    seg.push(this.type_encode_handler(ValueType.STRING));
                    this.MergeArray(seg, this.string_encode_handler(v.toString()));
                } else if (v === null) {
                    seg.push(this.type_encode_handler(ValueType.NULL));
                } else if (this.isBuffer(v)) {
                    seg.push(this.type_encode_handler(ValueType.BUFFERARRAY));
                    this.MergeArray(seg, this.buffer_encode_handler(v));
                } else {
                    seg.push(this.type_encode_handler(ValueType.OBJECT));
                    const al = this.MergeArrayBuffer(this.object_encode_handler(v));
                    let ll = new ArrayBuffer(4);
                    let llv = new DataView(ll);
                    llv.setUint32(0, al.byteLength);
                    seg.push(ll);
                    seg.push(al);
                }
            } else {
                throw new Error('bad object to serialization');
            }
        }

        return seg;
    } //}
    private object_decode_handler(view: DataView): [Object, number] //{
    {
        if(view.byteLength < 4) throw new Error('bad view for object');
        let l = view.getUint32(0);
        if(view.byteLength < (4 + l)) throw new Error('bad view for object');
        let ov = new DataView(view.buffer, view.byteOffset + 4, l);
        console.log(l);
        return [this.decode__xx(ov), l+4];
    } //}

    private encode__xx(obj: Object): ArrayBuffer //{
    {
        return this.MergeArrayBuffer(this.object_encode_handler(obj));
    } //}
    private decode__xx(view: DataView): Object //{
    {
        let ans = {};
        while(view.byteLength > 0) {
            const [f, l] = this.string_decode_handler(view);
            console.log(f);
            view = new DataView(view.buffer, view.byteOffset + l);
            let v = null;

            const t = this.type_decode_handler(view);
            view = new DataView(view.buffer, view.byteOffset + 1);
            switch(t) {
                case ValueType.BOOLEAN:
                    v = this.boolean_decode_handler(view);
                    view = new DataView(view.buffer, view.byteOffset + 1);
                    break;
                case ValueType.BUFFERARRAY:
                    let l = 0;
                    [v, l] = this.buffer_decode_handler(view);
                    v = this.viewToArrayBuffer(v);
                    view = new DataView(view.buffer, view.byteOffset + l);
                    break;
                case ValueType.NULL:
                    break;
                case ValueType.NUMBER:
                    v = this.number_decode_handler(view);
                    view = new DataView(view.buffer, view.byteOffset + 8);
                    break;
                case ValueType.OBJECT:
                    let l1 = 0;
                    [v, l1] = this.object_decode_handler(view);
                    view = new DataView(view.buffer, view.byteOffset + l1);
                    break;
                case ValueType.STRING:
                    let l2 = 0;
                    [v, l2] = this.string_decode_handler(view);
                    view = new DataView(view.buffer, view.byteOffset + l2);
                    break;
                default:
                    throw new Error(`It seems this view isn't a arraybuffer which serialized by counterpart encoder of THIS decoder`);
            }

            ans[f] = v;
        }

        return ans;
    } //}

    encode(msg: BasicMessage): ArrayBuffer //{
    {
        if(!(msg instanceof BasicMessage)) return null;
        return this.encode__xx(msg);
    } //}
    decode(ab: ArrayBuffer): BasicMessage //{
    {
        const obj = this.decode__xx(new DataView(ab));
        const ans = new BasicMessage();
        for(let prop in ans) {
            if(obj[prop] === undefined) return null;
        }

        utils.CopySourceEnumProp(obj, ans);
        return ans;
    } //}
}

