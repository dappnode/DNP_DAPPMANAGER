#!/bin/bash
IMAGE_NAME=mock-test.dnp.dappnode.eth:0.0.0
FILE_NAME=mock-test.dnp.dappnode.eth_0.0.0.tar.xz

docker build . -t $IMAGE_NAME
docker save $IMAGE_NAME | xz -e9T0 > $FILE_NAME