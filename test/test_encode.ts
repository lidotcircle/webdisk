import * as message from 'webdisk/lib/common/message';


const kkk = {
    asdf: false,
    yy: 10.01,
    uu: null,
    ll: "你好啊",
};
kkk["yyz"] = new String('asdfasdf');

let encoder = new message.MessageBIN();

let obj = new message.BasicMessage();
obj["akkkkk"] = kkk;
obj["asf"] = "asdf";

const x = encoder.encode(obj);
obj["hello"] = x;

const y = encoder.decode(x);
console.log(y);

const z = encoder.encode(obj);

const p = encoder.decode(z);
console.log(p);

