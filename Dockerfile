ARG NODE_VERSION=20.3.0

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
COPY package.json yarn.lock lerna.json tsconfig.json ./
RUN yarn --frozen-lockfile --non-interactive --ignore-scripts --ignore-optional
COPY packages/admin-ui/package.json \ 
  packages/admin-ui/
COPY packages/dappmanager/package.json \ 
  packages/dappmanager/
COPY packages/common/package.json \ 
  packages/common/
COPY packages/params/package.json \ 
  packages/params/
COPY packages/utils/package.json \ 
  packages/utils/
COPY packages/eventBus/package.json \ 
  packages/eventBus/
COPY packages/logger/package.json \ 
  packages/logger/
COPY packages/dockerCompose/package.json \ 
  packages/dockerCompose/
COPY packages/dockerApi/package.json \ 
  packages/dockerApi/
COPY packages/hostScriptsServices/package.json \
  packages/hostScriptsServices/
COPY packages/db/package.json \
  packages/db/
COPY packages/manifest/package.json \
  packages/manifest/
COPY packages/ipfs/package.json \
  packages/ipfs/
COPY packages/installer/package.json \
  packages/installer/
COPY packages/ethicalMetrics/package.json \
  packages/ethicalMetrics/
COPY packages/httpsPortal/package.json \
  packages/httpsPortal/
RUN yarn --frozen-lockfile --non-interactive --ignore-optional

# Build order must be as follows:
# params > common > utils > eventBus > dockerCompose > logger > hostscriptsServices > dockerApi > dappmanager > admin-ui

# Build params
WORKDIR /app/packages/params/
COPY packages/params/ .
RUN yarn build
# Results in dist/*

# Build ethicalmetrics
WORKDIR /app/packages/ethicalMetrics/
COPY packages/ethicalMetrics/ .
RUN yarn build
# Results in dist/*

# Build common
WORKDIR /app/packages/common/
COPY packages/common/ .
RUN yarn build
# Results in dist/*

# Build utils
WORKDIR /app/packages/utils/
COPY packages/utils/ .
RUN yarn build
# Results in dist/*

# Build eventBus
WORKDIR /app/packages/eventBus/
COPY packages/eventBus/ .
RUN yarn build
# Results in dist/*

# Build logger
WORKDIR /app/packages/logger/
COPY packages/logger/ .
RUN yarn build
# Results in dist/*

# Build dockerCompose
WORKDIR /app/packages/dockerCompose/
COPY packages/dockerCompose/ .
RUN yarn build
# Results in dist/*

# Build hostScriptsServices
WORKDIR /app/packages/hostScriptsServices/
COPY packages/hostScriptsServices/ .
RUN yarn build
# Results in dist/*

# Build manifest
WORKDIR /app/packages/manifest/
COPY packages/manifest/ .
RUN yarn build
# Results in dist/*

# Build dockerApi
WORKDIR /app/packages/dockerApi/
COPY packages/dockerApi/ .
RUN yarn build
# Results in dist/*

# Build httpsportal
WORKDIR /app/packages/httpsPortal/
COPY packages/httpsPortal/ .
RUN yarn build
# Results in dist/*

# Build db
WORKDIR /app/packages/db/
COPY packages/db/ .
RUN yarn build
# Results in dist/*

# Build ipfs
WORKDIR /app/packages/ipfs/
COPY packages/ipfs/ .
RUN yarn build
# Results in dist/*

# Build installer
WORKDIR /app/packages/installer/
COPY packages/installer/ .
RUN yarn build
# Results in dist/*

# Build dappmanager
WORKDIR /app/packages/dappmanager/
COPY packages/dappmanager/ .
RUN yarn build
# Results in dist/*

# Build admin-ui
WORKDIR /app/packages/admin-ui/
COPY packages/admin-ui/ .
ENV REACT_APP_API_URL /
RUN yarn build
# Results in build/*

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
COPY packages/hostScriptsServices/hostScripts /usr/src/app/hostsScripts
COPY packages/hostScriptsServices/hostServices /usr/src/app/services

# Copy root app
COPY --from=build-deps /usr/src/app/node_modules ./node_modules
COPY --from=build-deps /usr/src/app/package.json ./package.json
# Copy common
COPY --from=build-deps /usr/src/app/packages/common/dist ./packages/common/dist
COPY --from=build-deps /usr/src/app/packages/common/node_modules ./packages/common/node_modules
COPY --from=build-deps /usr/src/app/packages/common/package.json ./packages/common/package.json
# Copy params
COPY --from=build-deps /usr/src/app/packages/params/dist ./packages/params/dist
COPY --from=build-deps /usr/src/app/packages/params/node_modules ./packages/params/node_modules
COPY --from=build-deps /usr/src/app/packages/params/package.json ./packages/params/package.json
# Copy utils
COPY --from=build-deps /usr/src/app/packages/utils/dist ./packages/utils/dist
COPY --from=build-deps /usr/src/app/packages/utils/node_modules ./packages/utils/node_modules
COPY --from=build-deps /usr/src/app/packages/utils/package.json ./packages/utils/package.json
# Copy logger
COPY --from=build-deps /usr/src/app/packages/logger/dist ./packages/logger/dist
COPY --from=build-deps /usr/src/app/packages/logger/node_modules ./packages/logger/node_modules
COPY --from=build-deps /usr/src/app/packages/logger/package.json ./packages/logger/package.json
# Copy eventBus
COPY --from=build-deps /usr/src/app/packages/eventBus/dist ./packages/eventBus/dist
COPY --from=build-deps /usr/src/app/packages/eventBus/node_modules ./packages/eventBus/node_modules
COPY --from=build-deps /usr/src/app/packages/eventBus/package.json ./packages/eventBus/package.json
# Copy admin-ui
COPY --from=build-deps /usr/src/app/packages/admin-ui/build ./packages/admin-ui/build
COPY --from=build-deps /usr/src/app/packages/admin-ui/node_modules ./packages/admin-ui/node_modules
COPY --from=build-deps /usr/src/app/packages/admin-ui/package.json ./packages/admin-ui/package.json
# Copy dappmanager
COPY --from=build-deps /usr/src/app/packages/dappmanager/dist /usr/src/app/packages/dappmanager/dist
COPY --from=build-deps /usr/src/app/packages/dappmanager/node_modules /usr/src/app/packages/dappmanager/node_modules
COPY --from=build-deps /usr/src/app/packages/dappmanager/package.json /usr/src/app/packages/dappmanager/package.json
# Copy dockerApi
COPY --from=build-deps /usr/src/app/packages/dockerApi/dist /usr/src/app/packages/dockerApi/dist
COPY --from=build-deps /usr/src/app/packages/dockerApi/node_modules /usr/src/app/packages/dockerApi/node_modules
COPY --from=build-deps /usr/src/app/packages/dockerApi/package.json /usr/src/app/packages/dockerApi/package.json
# Copy dockerCompose
COPY --from=build-deps /usr/src/app/packages/dockerCompose/dist /usr/src/app/packages/dockerCompose/dist
COPY --from=build-deps /usr/src/app/packages/dockerCompose/node_modules /usr/src/app/packages/dockerCompose/node_modules
COPY --from=build-deps /usr/src/app/packages/dockerCompose/package.json /usr/src/app/packages/dockerCompose/package.json
# Copy HostScriptsServices
COPY --from=build-deps /usr/src/app/packages/hostScriptsServices/dist /usr/src/app/packages/hostScriptsServices/dist
COPY --from=build-deps /usr/src/app/packages/hostScriptsServices/node_modules /usr/src/app/packages/hostScriptsServices/node_modules
COPY --from=build-deps /usr/src/app/packages/hostScriptsServices/package.json /usr/src/app/packages/hostScriptsServices/package.json
# Copy db
COPY --from=build-deps /usr/src/app/packages/db/dist /usr/src/app/packages/db/dist
COPY --from=build-deps /usr/src/app/packages/db/node_modules /usr/src/app/packages/db/node_modules
COPY --from=build-deps /usr/src/app/packages/db/package.json /usr/src/app/packages/db/package.json
# Copyt manifest
COPY --from=build-deps /usr/src/app/packages/manifest/dist /usr/src/app/packages/manifest/dist
COPY --from=build-deps /usr/src/app/packages/manifest/node_modules /usr/src/app/packages/manifest/node_modules
COPY --from=build-deps /usr/src/app/packages/manifest/package.json /usr/src/app/packages/manifest/package.json
# Copyt installer
COPY --from=build-deps /usr/src/app/packages/installer/dist /usr/src/app/packages/installer/dist
COPY --from=build-deps /usr/src/app/packages/installer/node_modules /usr/src/app/packages/installer/node_modules
COPY --from=build-deps /usr/src/app/packages/installer/package.json /usr/src/app/packages/installer/package.json
# Copyt httpsportal
COPY --from=build-deps /usr/src/app/packages/httpsPortal/dist /usr/src/app/packages/httpsPortal/dist
COPY --from=build-deps /usr/src/app/packages/httpsPortal/node_modules /usr/src/app/packages/httpsPortal/node_modules
COPY --from=build-deps /usr/src/app/packages/httpsPortal/package.json /usr/src/app/packages/httpsPortal/package.json
# Copy ipfs
COPY --from=build-deps /usr/src/app/packages/ipfs/dist /usr/src/app/packages/ipfs/dist
COPY --from=build-deps /usr/src/app/packages/ipfs/node_modules /usr/src/app/packages/ipfs/node_modules
COPY --from=build-deps /usr/src/app/packages/ipfs/package.json /usr/src/app/packages/ipfs/package.json
# Copy ethicalmetrics
COPY --from=build-deps /usr/src/app/packages/ethicalMetrics/dist /usr/src/app/packages/ethicalMetrics/dist
COPY --from=build-deps /usr/src/app/packages/ethicalMetrics/node_modules /usr/src/app/packages/ethicalMetrics/node_modules
COPY --from=build-deps /usr/src/app/packages/ethicalMetrics/package.json /usr/src/app/packages/ethicalMetrics/package.json

CMD [ "node", "packages/dappmanager/dist/index" ]