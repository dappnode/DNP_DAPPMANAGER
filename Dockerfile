ARG NODE_VERSION=20.3.0

# Common base so it's cached
# --platform=$BUILDPLATFORM is used build javascript source with host arch
# Otherwise webpack builds on emulated archs can be extremely slow (+1h)
ARG BASE_IMAGE=node:${NODE_VERSION}-alpine3.18

# Initial stage to gather git data
FROM --platform=${BUILDPLATFORM:-amd64} ${BASE_IMAGE} as git-data

WORKDIR /usr/src/app
RUN apk add --no-cache git

COPY .git dappnode_package.json docker/getGitData.js ./

RUN node getGitData /usr/src/app/.git-data.json

# Build binaries (nsupdate, docker, docker-compose)
FROM --platform=${BUILDPLATFORM:-amd64} ${BASE_IMAGE} as build-binaries

RUN apk update && apk add --no-cache docker curl docker-compose bind-dev xz libltdl miniupnpc zip unzip

# Build source files
FROM --platform=${BUILDPLATFORM:-amd64} ${BASE_IMAGE} as build-src

WORKDIR /app

COPY package.json yarn.lock lerna.json tsconfig.json ./
COPY packages packages

# For the admin-ui
ENV REACT_APP_API_URL /

RUN yarn --frozen-lockfile --non-interactive --ignore-optional && \
  yarn build && \
  yarn clean:libraries && \
  yarn install --non-interactive --frozen-lockfile --production --force --ignore-optional

RUN rm -rf yarn.lock packages/*/node_modules packages/*/src packages/*/tsconfig.json packages/*/.eslint*

# Production stage
FROM node:${NODE_VERSION}-alpine

ENV COMPOSE_HTTP_TIMEOUT=300 \
  DOCKER_CLIENT_TIMEOUT=300 \
  DOCKER_HOST=unix:///var/run/docker.sock \
  UI_FILES_PATH=/usr/src/app/packages/admin-ui/build \
  GIT_DATA_PATH=.git-data.json 

WORKDIR /usr/src/app

# Copy docker and nsupdate binaries
COPY --from=build-binaries /usr/bin/nsupdate /usr/bin/docker \
  /usr/libexec/docker/cli-plugins/docker-compose \ 
  /usr/bin/curl /usr/bin/upnpc /usr/bin/zip /usr/bin/unzip /usr/bin/xz /usr/bin/

# TODO: In order to perform a copy like this we need to install the specific versions of the packages in build-binaries
#COPY from=build-binaries /usr/lib/libbind9-9.18.19.so /usr/lib/libltdl.so.7.3.2 /usr/share/dnssec-root/bind-dnssec-root.keys /usr/lib/

# TODO: Try to install these in the build stage
RUN apk add --no-cache dbus bind-tools bind-dev avahi-tools

# Copy git data
COPY --from=git-data /usr/src/app/.git-data.json $GIT_DATA_PATH

# Copy scripts
COPY packages/hostScripts/hostScripts /usr/src/app/hostScripts

# Copy docker-specific files
COPY docker/rndc.conf /etc/bind/
COPY docker/update_local_dyndns.sh /usr/local/bin/update_local_dyndns

COPY package.json ./ 
COPY --from=build-src /app/packages ./packages
COPY --from=build-src /app/node_modules ./node_modules

CMD [ "node", "packages/dappmanager/dist/index" ]