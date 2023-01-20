ARG NODE_VERSION=19.2.0

############
# GIT-DATA #
############
FROM --platform=${BUILDPLATFORM:-amd64} node:${NODE_VERSION}-alpine as git-data

WORKDIR /usr/src/app
RUN apk add --no-cache git

COPY .git .git
COPY dappnode_package.json .
COPY docker/getGitData.js .

RUN node getGitData /usr/src/app/.git-data.json

##################
# BUILD-BINARIES #
##################
FROM --platform=${BUILDPLATFORM:-amd64} node:${NODE_VERSION}-alpine as build-binaries

RUN apk add --no-cache bind-tools docker curl
RUN curl -L https://github.com/docker/compose/releases/download/v2.5.0/docker-compose-linux-$(uname -m) > /usr/local/bin/docker-compose \
  && chmod +x /usr/local/bin/docker-compose

# Common base so it's cached
# --platform=$BUILDPLATFORM is used build javascript source with host arch
# Otherwise webpack builds on emulated archs can be extremely slow (+1h)

#############
# BUILD-SRC #
#############
FROM --platform=${BUILDPLATFORM:-amd64} node:${NODE_VERSION}-alpine as build-src

WORKDIR /app
RUN apk add --no-cache python3 build-base

# Copy and install deps first to cache
COPY package.json yarn.lock lerna.json ./
COPY patches patches/
RUN yarn --frozen-lockfile --non-interactive --ignore-scripts --ignore-optional
COPY packages/admin-ui/package.json \ 
  packages/admin-ui/
COPY packages/dappmanager/package.json \ 
  packages/dappmanager/
COPY packages/common/package.json \ 
  packages/common/
RUN yarn --frozen-lockfile --non-interactive --ignore-optional

# Build common
WORKDIR /app/packages/common/
COPY packages/common/ .
RUN yarn build
# Results in dist/*

# Build admin-ui
WORKDIR /app/packages/admin-ui/
COPY packages/admin-ui/ .
ENV REACT_APP_API_URL /
RUN yarn build
# Results in build/*

# Build dappmanager
WORKDIR /app/packages/dappmanager/
COPY packages/dappmanager/ .
RUN yarn build
# Results in dist/*

##############
# BUILD-DEPS #
##############

FROM --platform=${BUILDPLATFORM:-amd64} node:${NODE_VERSION}-alpine as build-deps

WORKDIR /usr/src/app
RUN apk add --no-cache python3
COPY --from=build-src /app .
RUN yarn install --non-interactive --frozen-lockfile --production --force --ignore-optional

##############
# PRODUCTION #
##############
FROM node:${NODE_VERSION}-alpine

ENV COMPOSE_HTTP_TIMEOUT=300 \
  DOCKER_CLIENT_TIMEOUT=300 \
  DOCKER_HOST=unix:///var/run/docker.sock \
  UI_FILES_PATH=/usr/src/app/packages/admin-ui/build \
  GIT_DATA_PATH=.git-data.json 
WORKDIR /usr/src/app

# TODO: consider moving all these binaries to the build-binaries stage
RUN apk add --no-cache bind-dev xz libltdl miniupnpc zip unzip dbus bind avahi-tools

# Copy docker
COPY docker/rndc.conf /etc/bind/
COPY docker/update_local_dyndns.sh /usr/local/bin/update_local_dyndns

# Copy git data
COPY --from=git-data /usr/src/app/.git-data.json $GIT_DATA_PATH

# Copy binaries
COPY --from=build-binaries /usr/bin/nsupdate /usr/bin/nsupdate
COPY --from=build-binaries /usr/bin/docker /usr/bin/docker
COPY --from=build-binaries /usr/local/bin/docker-compose /usr/local/bin/docker-compose

# Copy scripts and services
COPY packages/dappmanager/hostScripts /usr/src/app/hostScripts
COPY packages/dappmanager/hostServices /usr/src/app/hostServices

# Copy root app
COPY --from=build-deps /usr/src/app/node_modules ./node_modules
COPY --from=build-deps /usr/src/app/package.json ./package.json
# Copy common
COPY --from=build-deps /usr/src/app/packages/common/dist ./packages/common/dist
COPY --from=build-deps /usr/src/app/packages/common/node_modules ./packages/common/node_modules
COPY --from=build-deps /usr/src/app/packages/common/package.json ./packages/common/package.json
# Copy admin-ui
COPY --from=build-deps /usr/src/app/packages/admin-ui/build ./packages/admin-ui/build
# Copy dappmanager
COPY --from=build-deps /usr/src/app/packages/dappmanager/dist /usr/src/app/packages/dappmanager/dist
COPY --from=build-deps /usr/src/app/packages/dappmanager/node_modules /usr/src/app/packages/dappmanager/node_modules
COPY --from=build-deps /usr/src/app/packages/dappmanager/package.json /usr/src/app/packages/dappmanager/package.json

CMD [ "node", "packages/dappmanager/dist/index" ]