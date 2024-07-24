# Arguments
ARG NODE_VERSION=20.3.0
ARG BASE_IMAGE=node:${NODE_VERSION}-alpine3.18
ARG BUILDPLATFORM

# Initial stage to gather git data
FROM --platform=${BUILDPLATFORM:-amd64} ${BASE_IMAGE} AS git-data
WORKDIR /usr/src/app
RUN apk add --no-cache git
COPY .git dappnode_package.json docker/getGitData.js ./
RUN node getGitData /usr/src/app/.git-data.json

# Build stage
FROM --platform=${BUILDPLATFORM:-amd64} ${BASE_IMAGE} AS build-src
WORKDIR /app

# Install necessary packages required by vite
RUN apk add --no-cache python3 py3-pip build-base

# Copy and build packages
COPY package.json yarn.lock lerna.json tsconfig.json ./
COPY packages packages
ENV VITE_APP_API_URL /
RUN yarn install --non-interactive --frozen-lockfile && \
  yarn build && \
  yarn clean:libraries && \
  yarn install --non-interactive --frozen-lockfile --production --force --ignore-optional
RUN rm -rf yarn.lock packages/*/src packages/*/tsconfig.json packages/*/.eslint*

# Production stage
FROM node:${NODE_VERSION}-alpine
WORKDIR /usr/src/app

# Environment variables
ENV COMPOSE_HTTP_TIMEOUT=300 \
  DOCKER_CLIENT_TIMEOUT=300 \
  DOCKER_HOST=unix:///var/run/docker.sock \
  UI_FILES_PATH=/usr/src/app/packages/admin-ui/build \
  GIT_DATA_PATH=.git-data.json 

# Install necessary packages
RUN apk add --no-cache docker curl docker-cli-compose xz zip unzip libltdl bind bind-dev bind-tools avahi-tools dbus miniupnpc

# Copy git data
COPY --from=git-data /usr/src/app/.git-data.json $GIT_DATA_PATH

# Copy scripts and built files
COPY packages/hostScriptsServices/hostScripts hostScripts
COPY packages/hostScriptsServices/hostServices hostServices
COPY packages/hostScriptsServices/hostTimers hostTimers
COPY package.json ./
COPY --from=build-src /app/packages ./packages
COPY --from=build-src /app/node_modules ./node_modules

# Command
CMD ["node", "packages/dappmanager/dist/index"]
