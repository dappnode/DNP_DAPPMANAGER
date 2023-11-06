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

# Copy compiled files
COPY --from=build-src /app/node_modules ./node_modules
COPY --from=build-src /app/package.json ./package.json

# Copy packages dist
COPY --from=build-src /app/packages/*/dist ./packages/

# Copy packages node_modules
COPY --from=build-src /app/packages/*/node_modules ./packages/

# Copy packages package.json
COPY --from=build-src /app/packages/*/package.json ./packages/

CMD [ "node", "packages/dappmanager/dist/index" ]