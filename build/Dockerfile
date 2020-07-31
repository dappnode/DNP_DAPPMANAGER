# Common base so it's cached
#####################################
FROM node:10.15.3-alpine as build-monorepo

WORKDIR /app

RUN apk add --no-cache python build-base bash

# Copy and install deps first to cache
COPY package.json yarn.lock lerna.json ./
COPY patches patches/
RUN yarn --frozen-lockfile --non-interactive
COPY packages/admin-ui/package.json \ 
  packages/admin-ui/yarn.lock \ 
  packages/admin-ui/
COPY packages/dappmanager/package.json \ 
  packages/dappmanager/yarn.lock \
  packages/dappmanager/
RUN yarn bootstrap

# Build UI
WORKDIR /app/packages/admin-ui/
COPY packages/admin-ui/ .
ENV REACT_APP_API_URL /
RUN yarn build
# Results in build/*

WORKDIR /app/packages/dappmanager/
COPY packages/dappmanager/ .
RUN yarn build
# Results in build/index.js



# Compute git data
#####################################
FROM node:10.15.3-alpine as git-data

WORKDIR /usr/src/app

RUN apk add --no-cache git
COPY .git .git
COPY dappnode_package.json .
COPY build/getGitData.js .
RUN node getGitData /usr/src/app/.git-data.json



# Build binaries
#####################################
FROM node:10.15.3-alpine as build-binaries

RUN apk add --no-cache bind-tools docker



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

COPY --from=build-binaries /usr/bin/nsupdate /usr/bin/nsupdate
COPY --from=build-binaries /usr/bin/docker /usr/bin/docker

# Copy the src last as it's the layer most likely to change
COPY packages/dappmanager/hostScripts /usr/src/app/hostScripts
COPY --from=build-monorepo /app/packages/admin-ui/build $UI_FILES_PATH
COPY --from=build-monorepo /app/packages/dappmanager/build /usr/src/app/
COPY --from=git-data /usr/src/app/.git-data.json $GIT_DATA_PATH

COPY build/rndc.conf /etc/bind/
COPY build/update_local_dyndns.sh /usr/local/bin/update_local_dyndns

CMD [ "node", "index" ]
