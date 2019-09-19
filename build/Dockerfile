# Layer 1: Build the dependencies
#####################################
FROM node:10.15.3-alpine as build-deps

RUN apk add --no-cache git python build-base bind-tools docker bash jq

WORKDIR /usr/src/app

# Install app dependencies to use docker's layer cache
COPY build/src/package.json ./
COPY build/src/yarn.lock ./
RUN yarn install --production

# Get this DNP version and git hash. Results in /usr/src/app/.version.json
COPY .git .git
COPY dappnode_package.json .
COPY build/src/getVersionData.sh .
RUN ./getVersionData.sh


# Layer 2: Build the source .ts files
#####################################
FROM node:10.15.3-alpine as build-src

RUN apk add --no-cache git python build-base bind-tools docker bash jq

WORKDIR /usr/src/app

# Add source
COPY build/src/package.json ./
COPY build/src/yarn.lock ./
RUN yarn add typescript
COPY build/src .
RUN yarn build


# Layer 3: Final layer
#####################################
FROM node:10.15.3-alpine

ENV DOCKER_COMPOSE_VERSION 1.20.1

RUN apk add --no-cache curl bind-dev xz libltdl miniupnpc zip unzip dbus

RUN ALPINE_GLIBC_BASE_URL="https://github.com/sgerrand/alpine-pkg-glibc/releases/download" && \
  ALPINE_GLIBC_PACKAGE_VERSION="2.28-r0" && \
  ALPINE_GLIBC_BASE_PACKAGE_FILENAME="glibc-$ALPINE_GLIBC_PACKAGE_VERSION.apk" && \
  ALPINE_GLIBC_BIN_PACKAGE_FILENAME="glibc-bin-$ALPINE_GLIBC_PACKAGE_VERSION.apk" && \
  ALPINE_GLIBC_I18N_PACKAGE_FILENAME="glibc-i18n-$ALPINE_GLIBC_PACKAGE_VERSION.apk" && \
  apk add --no-cache --virtual=.build-dependencies wget ca-certificates && \
  wget --no-verbose \
  "https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub" \
  -O "/etc/apk/keys/sgerrand.rsa.pub" && \
  wget --no-verbose \
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

COPY --from=build-deps /usr/bin/nsupdate /usr/bin/nsupdate
COPY --from=build-deps /usr/bin/docker /usr/bin/docker

COPY build/entrypoint.sh .
COPY build/dns_updater.sh /etc/periodic/1min/dns_updater
RUN crontab -l | { cat; echo "*       *       *       *       *       run-parts   /etc/periodic/1min"; } | crontab -

# Copy the src last as it's the layer most likely to change
COPY --from=build-deps /usr/src/app /usr/src/app
COPY build/src/test /usr/src/app/test
COPY --from=build-src /usr/src/app/dist /usr/src/app/src

ENTRYPOINT /usr/src/app/entrypoint.sh
