#!/usr/bin/env bash

cd "`dirname "$0"`"

actual_path=$(readlink -f "${BASH_SOURCE[0]}")
script_dir=$(dirname "$actual_path")

export DEBUG=oracle*
node $script_dir/src/index.js &> > $script_dir/log.txt