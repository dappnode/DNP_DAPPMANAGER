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
# TODO: Remove bind modules when we don't use Bind package?
# These packages create several files
RUN apk add --no-cache docker curl docker-cli-compose xz zip unzip libltdl bind bind-dev bind-tools avahi-tools dbus miniupnpc

# Copy git data
COPY --from=git-data /usr/src/app/.git-data.json $GIT_DATA_PATH

# Copy scripts
COPY packages/hostScriptsServices/hostScripts hostScripts
COPY packages/hostScriptsServices/hostServices hostServices

COPY package.json ./ 
COPY --from=build-src /app/packages ./packages
COPY --from=build-src /app/node_modules ./node_modules

CMD [ "node", "packages/dappmanager/dist/index" ]