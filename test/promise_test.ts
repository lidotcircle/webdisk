async function hello() {
    console.log("hello");
    throw new Error("hello");
}

function test() {
    hello().then(null, () => {console.log("error");});
}

test();
