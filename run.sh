#!/usr/bin/env bash

cd "`dirname "$0"`"

export DEBUG=oracle*

source ./.env
node ./src/index.js &> ./log.txt
