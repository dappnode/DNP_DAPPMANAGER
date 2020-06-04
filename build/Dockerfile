# Layer 0: Common base so it's cached 
#####################################
FROM node:10.15.3-alpine as build-base

RUN apk add --no-cache git python build-base bind-tools docker bash jq

WORKDIR /usr/src/app

# Install app dependencies to use docker's layer cache
COPY build/src/package.json ./
COPY build/src/yarn.lock ./
RUN yarn install --production --link-duplicates
# --link-duplicates: hardlinks for repeated modules. 193964 => 175592

# Layer 1: Build the dependencies
#####################################
FROM build-base as build-deps

# Apply patch-package
COPY build/src/patches patches
RUN yarn add -D patch-package --production --frozen-lockfile --skip-integrity-check
RUN yarn prepare

# Get this DNP version and git hash. Results in /usr/src/app/.version.json
COPY .git .git
COPY dappnode_package.json .
COPY build/src/getVersionData.sh .
RUN ./getVersionData.sh


# Layer 2: Build the source .ts files
#####################################
FROM build-base as build-src

RUN yarn install --frozen-lockfile
COPY build/src .
RUN yarn build


# Layer 3: Final layer
#####################################
FROM node:10.15.3-alpine

ENV DOCKER_COMPOSE_VERSION 1.25.5

RUN apk add --no-cache curl bind-dev xz libltdl miniupnpc zip unzip dbus bind

RUN curl -L https://github.com/dappnode/compose/releases/download/$DOCKER_COMPOSE_VERSION/docker-compose-Linux-$(uname -m) > /usr/local/bin/docker-compose \
  && chmod +x /usr/local/bin/docker-compose

# Copy files and do things that can change

WORKDIR /usr/src/app

COPY --from=build-deps /usr/bin/nsupdate /usr/bin/nsupdate
COPY --from=build-deps /usr/bin/docker /usr/bin/docker

# Copy the src last as it's the layer most likely to change
COPY build/src/hostScripts /usr/src/app/hostScripts
COPY --from=build-deps /usr/src/app /usr/src/app
COPY --from=build-src /usr/src/app/dist /usr/src/app/src

COPY build/rndc.conf /etc/bind/
COPY build/update_local_dyndns.sh /usr/local/bin/update_local_dyndns

ENV COMPOSE_HTTP_TIMEOUT=300 DOCKER_CLIENT_TIMEOUT=300 DOCKER_HOST=unix:///var/run/docker.sock
RUN echo "127.0.0.1 localunixsocket"

CMD [ "node", "src/index" ]
