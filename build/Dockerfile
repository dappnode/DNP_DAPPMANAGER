FROM node:8.9.4-alpine as build

RUN apk add --no-cache git python build-base bind-tools docker bash

WORKDIR /usr/src/app

# Install app dependencies to use docker's layer cache
ADD build/src/package*.json ./
RUN npm install --production

# Add source
ADD build/src .

# Get this DNP version and git hash. Results in /usr/src/app/.version.json
ADD .git .git
ADD dappnode_package.json .
RUN node getVersion
RUN rm dappnode_package.json && rm -r .git

# This results in a single layer image
FROM node:8.9.4-alpine

ENV DOCKER_COMPOSE_VERSION 1.20.1

RUN apk add --no-cache curl bind-dev xz

RUN ALPINE_GLIBC_BASE_URL="https://github.com/sgerrand/alpine-pkg-glibc/releases/download" && \
    ALPINE_GLIBC_PACKAGE_VERSION="2.28-r0" && \
    ALPINE_GLIBC_BASE_PACKAGE_FILENAME="glibc-$ALPINE_GLIBC_PACKAGE_VERSION.apk" && \
    ALPINE_GLIBC_BIN_PACKAGE_FILENAME="glibc-bin-$ALPINE_GLIBC_PACKAGE_VERSION.apk" && \
    ALPINE_GLIBC_I18N_PACKAGE_FILENAME="glibc-i18n-$ALPINE_GLIBC_PACKAGE_VERSION.apk" && \
    apk add --no-cache --virtual=.build-dependencies wget ca-certificates && \
    wget \
        "https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub" \
        -O "/etc/apk/keys/sgerrand.rsa.pub" && \
    wget \
        "$ALPINE_GLIBC_BASE_URL/$ALPINE_GLIBC_PACKAGE_VERSION/$ALPINE_GLIBC_BASE_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_BASE_URL/$ALPINE_GLIBC_PACKAGE_VERSION/$ALPINE_GLIBC_BIN_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_BASE_URL/$ALPINE_GLIBC_PACKAGE_VERSION/$ALPINE_GLIBC_I18N_PACKAGE_FILENAME" && \
    apk add --no-cache \
        "$ALPINE_GLIBC_BASE_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_BIN_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_I18N_PACKAGE_FILENAME" && \
    \
    rm "/etc/apk/keys/sgerrand.rsa.pub" && \
    /usr/glibc-compat/bin/localedef --force --inputfile POSIX --charmap UTF-8 "$LANG" || true && \
    echo "export LANG=$LANG" > /etc/profile.d/locale.sh && \
    \
    apk del glibc-i18n && \
    \
    rm "/root/.wget-hsts" && \
    apk del .build-dependencies && \
    rm \
        "$ALPINE_GLIBC_BASE_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_BIN_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_I18N_PACKAGE_FILENAME"

RUN curl -L https://github.com/docker/compose/releases/download/$DOCKER_COMPOSE_VERSION/docker-compose-Linux-x86_64 > /usr/local/bin/docker-compose \
  && chmod +x /usr/local/bin/docker-compose

# Copy files and do things that can change

WORKDIR /usr/src/app

COPY --from=build /usr/bin/nsupdate /usr/bin/nsupdate
COPY --from=build /usr/bin/docker /usr/bin/docker

COPY build/dns_updater.sh /etc/periodic/1min/dns_updater
COPY build/entrypoint.sh .
RUN chmod +x /etc/periodic/1min/dns_updater
RUN crontab -l | { cat; echo "*       *       *       *       *       run-parts   /etc/periodic/1min"; } | crontab -

ENV DB_PATH /usr/src/app/DNCORE/dappmanagerdb.json

# Copy the src the last as it's the more likely layer to change
COPY --from=build /usr/src/app /usr/src/app

ENTRYPOINT /usr/src/app/entrypoint.sh
