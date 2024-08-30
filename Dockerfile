# Arguments
ARG BASE_IMAGE=node:20.16.0-alpine3.19
ARG BUILDPLATFORM

# Initial stage to gather git data
FROM ${BASE_IMAGE} AS git-data
WORKDIR /usr/src/app
COPY .git dappnode_package.json docker/getGitData.js ./
RUN apk add --no-cache git
RUN node getGitData /usr/src/app/.git-data.json

# Build stage
FROM ${BASE_IMAGE} AS build-src
ENV VITE_APP_API_URL /
WORKDIR /app

# Copy and build packages
COPY package.json yarn.lock .yarnrc.yml tsconfig.json ./
COPY packages packages

# Install necessary packages required by vite
RUN apk add --no-cache python3 py3-pip build-base
# Install corepack to be able to use modern yarn berry
RUN corepack enable
RUN yarn install --immutable
# Build and install production dependencies
RUN yarn build && \
  yarn workspaces focus --all --production
# Remove unnecessary files
RUN rm -rf yarn.lock packages/*/src packages/*/tsconfig.json packages/*/.eslint*

# Production stage
FROM ${BASE_IMAGE}
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
