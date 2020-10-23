import * as message from 'webdisk/lib/common/message';

function str(n, c) {
    let ans = '';
    while(n > 0) {
        ans += c;
        n--;
    }
    return ans;
}

let k1 = str(20, 'z');
let k2 = str(0x10, 'y');

const kkk = {
    asdf: false,
    zxcv: '\x33\x33\x33\x33'
};
kkk[k1] = false;
kkk[k2] = true;

let encoder = new message.MessageBIN();
let obj = new message.BasicMessage();
let kk = new ArrayBuffer(1000);
let vv = new DataView(kk, 200);
obj["akkkkk"] = kkk;
obj["axx"] = "\x44\x44\x44\x44\x44";
obj["uvw"] = {
    a: {
        a: 'x'
    },
    b: new ArrayBuffer(20),
    c: false,
    d: 10.00000001,
    e: new String('asdf'),
    f: [1,2,3,4],
    g: vv
}

console.log(obj);
const x = encoder.encode(obj);
let b = Buffer.from(x);
console.log(b.toString('hex'));
const y = encoder.decode(x);
console.log(y);

