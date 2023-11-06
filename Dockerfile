ARG NODE_VERSION=20.3.0

# Common base so it's cached
# --platform=$BUILDPLATFORM is used build javascript source with host arch
# Otherwise webpack builds on emulated archs can be extremely slow (+1h)
ARG BASE_IMAGE=node:${NODE_VERSION}-alpine

# Initial stage to gather git data
FROM --platform=${BUILDPLATFORM:-amd64} ${BASE_IMAGE} as git-data

WORKDIR /usr/src/app
RUN apk add --no-cache git

COPY .git dappnode_package.json docker/getGitData.js ./

RUN node getGitData /usr/src/app/.git-data.json

# Build binaries (nsupdate, docker, docker-compose)
FROM --platform=${BUILDPLATFORM:-amd64} ${BASE_IMAGE} as build-binaries

RUN apk add --no-cache bind-tools docker curl
# TODO: Consider installing docker-compose from apk and removing curl
RUN curl -L https://github.com/docker/compose/releases/download/v2.5.0/docker-compose-linux-$(uname -m) > /usr/local/bin/docker-compose \
  && chmod +x /usr/local/bin/docker-compose

# Build source files
FROM --platform=${BUILDPLATFORM:-amd64} ${BASE_IMAGE} as build-src

WORKDIR /app

COPY package.json yarn.lock lerna.json tsconfig.json ./
COPY packages packages

# For the admin-ui
ENV REACT_APP_API_URL /

RUN yarn --frozen-lockfile --non-interactive --ignore-optional && \
  yarn build && \
  yarn install --non-interactive --frozen-lockfile --production --force --ignore-optional

# Production stage
FROM node:${NODE_VERSION}-alpine

ENV COMPOSE_HTTP_TIMEOUT=300 \
  DOCKER_CLIENT_TIMEOUT=300 \
  DOCKER_HOST=unix:///var/run/docker.sock \
  UI_FILES_PATH=/usr/src/app/packages/admin-ui/build \
  GIT_DATA_PATH=.git-data.json 

WORKDIR /usr/src/app

# TODO: consider moving all these binaries to the build-binaries stage
RUN apk add --no-cache bind-dev xz libltdl miniupnpc zip unzip dbus bind avahi-tools

# Copy git data
COPY --from=git-data /usr/src/app/.git-data.json $GIT_DATA_PATH

# Copy scripts
COPY packages/hostScripts/hostScripts /usr/src/app/hostScripts

# Copy docker-specific files
COPY docker/rndc.conf /etc/bind/
COPY docker/update_local_dyndns.sh /usr/local/bin/update_local_dyndns

# Copy docker and nsupdate binaries
COPY --from=build-binaries /usr/bin/nsupdate /usr/bin/docker /usr/local/bin/docker-compose /usr/local/bin/

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
# Copy HostScripts
COPY --from=build-deps /usr/src/app/packages/hostScripts/dist /usr/src/app/packages/hostScripts/dist
COPY --from=build-deps /usr/src/app/packages/hostScripts/node_modules /usr/src/app/packages/hostScripts/node_modules
COPY --from=build-deps /usr/src/app/packages/hostScripts/package.json /usr/src/app/packages/hostScripts/package.json
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