#!/bin/bash

test_dir="$PWD/testme"

if [ ! $# -eq 1 ]; then
    echo "usage: ${0} testname"
    exit 1
fi

if [ ! -d ${test_dir} ]; then
    echo "build before tset"
    exit 2
fi

test_js_file="${test_dir}/${1}_test.js"

if [ ! -f ${test_js_file} ]; then
    echo "can't find test file [$test_js_file]"
    exit 3
fi

cd ${test_dir}
exec $(which node) ${test_js_file}

