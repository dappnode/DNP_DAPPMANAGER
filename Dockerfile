# Arguments
ARG BASE_IMAGE=node:24.22.1-alpine3.23
ARG BUILDPLATFORM

# The verifier is built from a fixed source revision for the target architecture.
FROM rust:1.94.0-alpine3.23 AS update-light-client
RUN apk add --no-cache build-base curl perl openssl-dev openssl-libs-static cmake git
WORKDIR /src
RUN curl -fsSL https://github.com/a16z/helios/archive/2af9b41887e069144ee56cd710f3ddca195473f8.tar.gz -o helios.tar.gz && \
    echo "d6059d531efa60c6a3da8157a8fe59182f21049efa5b2ac6659d8f47d67e3cd1  helios.tar.gz" | sha256sum -c - && \
    tar -xzf helios.tar.gz --strip-components=1 && rm helios.tar.gz
ENV OPENSSL_STATIC=1
RUN cargo build --locked --release --package helios-cli && strip target/release/helios

# Offline cryptographic regressions, invoked explicitly by CI.
FROM update-light-client AS update-light-client-tests
COPY test/update-light-client-proof.rs core/tests/dappnode_proof.rs
RUN cargo test --locked --package helios-consensus-core --lib --test sync && \
    cargo test --locked --package helios-core --lib execution::proof && \
    cargo test --locked --package helios-core --test dappnode_proof

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
RUN apk add --no-cache ca-certificates docker curl docker-cli-compose xz zip unzip libltdl bind bind-dev bind-tools avahi-tools dbus miniupnpc

COPY --from=update-light-client /src/target/release/helios /usr/local/bin/helios

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
