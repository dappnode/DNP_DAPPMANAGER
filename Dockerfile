ARG NODE_VERSION=19.2.0

# Common base so it's cached
# --platform=$BUILDPLATFORM is used build javascript source with host arch
# Otherwise webpack builds on emulated archs can be extremely slow (+1h)
#####################################
FROM --platform=${BUILDPLATFORM:-amd64} node:${NODE_VERSION}-alpine as build-monorepo

WORKDIR /app

RUN apk add --no-cache python3 build-base bash

# Copy and install deps first to cache
COPY package.json yarn.lock lerna.json ./
COPY patches patches/
# Install lerna first
RUN yarn --frozen-lockfile --non-interactive --ignore-scripts --ignore-optional
COPY packages/admin-ui/package.json \ 
  packages/admin-ui/
COPY packages/dappmanager/package.json \ 
  packages/dappmanager/
COPY packages/common/package.json \ 
  packages/common/
RUN yarn install --production

# Build common
WORKDIR /app/packages/common/
COPY packages/common/ .
RUN yarn generate
RUN yarn build 
# Results in dist/*

# Build admin-ui
WORKDIR /app/packages/admin-ui/
COPY packages/admin-ui/ .
ENV REACT_APP_API_URL /
RUN yarn build
# Results in build/*

# Build DAPPMANAGER
WORKDIR /app/packages/dappmanager/
COPY packages/dappmanager/ .
RUN yarn build
# Results in build/index.js

# Compute git data
#####################################
FROM --platform=${BUILDPLATFORM:-amd64} node:${NODE_VERSION}-alpine as git-data

WORKDIR /usr/src/app

RUN apk add --no-cache git
COPY .git .git
COPY dappnode_package.json .
COPY docker/getGitData.js .
RUN node getGitData /usr/src/app/.git-data.json

# Build binaries
#####################################
FROM node:${NODE_VERSION}-alpine as build-binaries

RUN apk add --no-cache bind-tools docker

# Final layer
#####################################
FROM node:${NODE_VERSION}-alpine

ENV DOCKER_COMPOSE_VERSION v2.5.0

RUN apk add --no-cache curl bind-dev xz libltdl miniupnpc zip unzip dbus bind \
  # See https://github.com/dappnode/DNP_DAPPMANAGER/issues/669
  avahi-tools

RUN curl -L https://github.com/docker/compose/releases/download/$DOCKER_COMPOSE_VERSION/docker-compose-linux-$(uname -m) > /usr/local/bin/docker-compose \
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
COPY packages/dappmanager/hostServices /usr/src/app/hostServices
COPY --from=build-monorepo /app/packages/admin-ui/build $UI_FILES_PATH
COPY --from=build-monorepo /app/packages/dappmanager/build /usr/src/app/
COPY --from=git-data /usr/src/app/.git-data.json $GIT_DATA_PATH

COPY docker/rndc.conf /etc/bind/
COPY docker/update_local_dyndns.sh /usr/local/bin/update_local_dyndns

CMD [ "node", "index" ]
