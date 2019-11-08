#!/bin/bash
IMAGE_NAME=mock-test.public.dappnode.eth:0.0.1
FILE_NAME=mock-test.public.dappnode.eth_0.0.1.tar.xz

docker-compose build
docker save $IMAGE_NAME | xz -e9T0 > buildFiles/$FILE_NAME