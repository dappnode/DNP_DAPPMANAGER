FROM node:8.9.4-alpine as build

RUN apk add --no-cache git python build-base bind-tools docker bash

WORKDIR /usr/src/app

ADD apm.js .
ADD index.js .
ADD package-lock.json .
ADD package.json . 
ADD entrypoint.sh .

RUN npm install

# This results in a single layer image
FROM node:8.9.4-alpine

ENV DOCKER_COMPOSE_VERSION 1.20.1

RUN apk add --no-cache bind-tools curl

RUN set -x && \
    apk add --no-cache -t .deps ca-certificates curl && \
    # Install glibc on Alpine (required by docker-compose) from
    # https://github.com/sgerrand/alpine-pkg-glibc
    # See also https://github.com/gliderlabs/docker-alpine/issues/11
    GLIBC_VERSION='2.23-r3' && \
    curl -Lo /etc/apk/keys/sgerrand.rsa.pub https://raw.githubusercontent.com/sgerrand/alpine-pkg-glibc/master/sgerrand.rsa.pub && \
    curl -Lo glibc.apk https://github.com/sgerrand/alpine-pkg-glibc/releases/download/$GLIBC_VERSION/glibc-$GLIBC_VERSION.apk && \
    curl -Lo glibc-bin.apk https://github.com/sgerrand/alpine-pkg-glibc/releases/download/$GLIBC_VERSION/glibc-bin-$GLIBC_VERSION.apk && \
    apk update && \
    apk add glibc.apk glibc-bin.apk && \
    rm -rf /var/cache/apk/* && \
    rm glibc.apk glibc-bin.apk && \
    \
    # Clean-up
    apk del .deps

RUN curl -L https://github.com/docker/compose/releases/download/$DOCKER_COMPOSE_VERSION/docker-compose-Linux-x86_64 > /usr/local/bin/docker-compose \
  && chmod +x /usr/local/bin/docker-compose

WORKDIR /usr/src/app

COPY --from=build /usr/src/app /usr/src/app
COPY --from=build /usr/bin/nsupdate /usr/bin/nsupdate
COPY --from=build /usr/bin/docker /usr/bin/docker

COPY ./dns_updater.sh /etc/periodic/1min/dns_updater
RUN chmod +x /etc/periodic/1min/dns_updater
RUN crontab -l | { cat; echo "*       *       *       *       *       run-parts   /etc/periodic/1min"; } | crontab -

ENTRYPOINT /usr/src/app/entrypoint.sh
