# Common base so it's cached 
#####################################
FROM node:10.15.3-alpine as build-base

WORKDIR /usr/src/app

RUN apk add --no-cache python build-base bind-tools docker bash

# Install app dependencies to use docker's layer cache
COPY build/src/package.json ./
COPY build/src/yarn.lock ./
RUN yarn install --production --link-duplicates
# --link-duplicates: hardlinks for repeated modules. 193964 => 175592

# Build server dependencies
#####################################
FROM build-base as build-deps

# Apply patch-package
COPY build/src/patches patches
RUN yarn add -D patch-package --production --frozen-lockfile --skip-integrity-check
RUN yarn prepare



# Build server source .ts files
#####################################
FROM build-base as build-src

RUN yarn install --frozen-lockfile
COPY build/src .
RUN yarn build



# Compute git data
#####################################
FROM node:10.15.3-alpine as git-data

WORKDIR /usr/src/app

RUN apk add --no-cache git
COPY .git .git
COPY dappnode_package.json .
COPY build/getGitData.js .
RUN node getGitData /usr/src/app/.git-data.json



# UI build
#####################################
FROM node:10.15.3-alpine as build-ui

WORKDIR /usr/src/app

# Copy and install deps first to cache
COPY build/ui/package.json build/ui/yarn.lock ./
RUN yarn --production
COPY build/ui .
RUN yarn generate
ENV REACT_APP_API_URL http://my.dappmanager.dnp.dappnode.eth:3000/
RUN yarn build
# Results in build/*



# Final layer
#####################################
FROM node:10.15.3-alpine

ENV DOCKER_COMPOSE_VERSION 1.25.5

RUN apk add --no-cache curl bind-dev xz libltdl miniupnpc zip unzip dbus bind

RUN curl -L https://github.com/dappnode/compose/releases/download/$DOCKER_COMPOSE_VERSION/docker-compose-Linux-$(uname -m) > /usr/local/bin/docker-compose \
  && chmod +x /usr/local/bin/docker-compose

WORKDIR /usr/src/app

ENV COMPOSE_HTTP_TIMEOUT=300 \
  DOCKER_CLIENT_TIMEOUT=300 \
  DOCKER_HOST=unix:///var/run/docker.sock \
  UI_FILES_PATH=dist \
  GIT_DATA_PATH=.git-data.json

COPY --from=build-deps /usr/bin/nsupdate /usr/bin/nsupdate
COPY --from=build-deps /usr/bin/docker /usr/bin/docker

# Copy the src last as it's the layer most likely to change
COPY build/src/hostScripts /usr/src/app/hostScripts
COPY --from=build-deps /usr/src/app /usr/src/app
COPY --from=build-src /usr/src/app/dist /usr/src/app/src
COPY --from=build-ui /usr/src/app/build $UI_FILES_PATH
COPY --from=git-data /usr/src/app/.git-data.json $GIT_DATA_PATH

COPY build/rndc.conf /etc/bind/
COPY build/update_local_dyndns.sh /usr/local/bin/update_local_dyndns

CMD [ "node", "src/index" ]
