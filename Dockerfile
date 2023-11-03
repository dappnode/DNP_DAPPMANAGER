ARG NODE_VERSION=20.3.0
ARG BASE_IMAGE=node:${NODE_VERSION}-alpine

############
# GIT-DATA #
############
FROM --platform=${BUILDPLATFORM:-amd64} ${BASE_IMAGE} as git-data

WORKDIR /usr/src/app
RUN apk add --no-cache git

COPY .git dappnode_package.json docker/getGitData.js ./

RUN node getGitData /usr/src/app/.git-data.json

##################
# BUILD-BINARIES #
##################
FROM --platform=${BUILDPLATFORM:-amd64} ${BASE_IMAGE} as build-binaries

RUN apk add --no-cache bind-tools docker curl
RUN curl -L https://github.com/docker/compose/releases/download/v2.5.0/docker-compose-linux-$(uname -m) > /usr/local/bin/docker-compose \
  && chmod +x /usr/local/bin/docker-compose

# Common base so it's cached
# --platform=$BUILDPLATFORM is used build javascript source with host arch
# Otherwise webpack builds on emulated archs can be extremely slow (+1h)

#############
# BUILD-SRC #
#############
FROM --platform=${BUILDPLATFORM:-amd64} ${BASE_IMAGE} as build-src

WORKDIR /app
RUN apk add --no-cache python3 build-base

COPY package.json yarn.lock lerna.json tsconfig.json ./
COPY packages packages

# For the admin-ui
ENV REACT_APP_API_URL /

RUN yarn --frozen-lockfile --non-interactive --ignore-optional --ignore-scripts && \
  yarn build && \
  yarn install --non-interactive --frozen-lockfile --production --force --ignore-optional

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
COPY --from=build-binaries /usr/bin/nsupdate /usr/bin/docker /usr/local/bin/docker-compose /usr/local/bin/

COPY --from=build-deps /usr/src/app .
CMD [ "node", "packages/dappmanager/dist/index" ]