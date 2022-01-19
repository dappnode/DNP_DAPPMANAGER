ARG UPSTREAM_VERSION

##########
# FLYWAY #
##########
#FROM flyway/flyway:8.0.5-alpine as binary-flyway
#COPY --from=binary-flyway /flyway/flyway /usr/local/bin/flyway

##############
# MIGRATIONS #
##############
FROM debian:bullseye-slim as postgres-migrations
ARG UPSTREAM_VERSION
WORKDIR /usr/src/app

RUN apt update && apt install -y wget
# Get migrations from consensys web3signer repo
# path is /usr/src/app/web3signer-21.10.0/slashing-protection/src/main/resources/migrations/postgresql
RUN wget -q https://github.com/ConsenSys/web3signer/archive/refs/tags/${UPSTREAM_VERSION}.tar.gz && \
    tar -xvf ${UPSTREAM_VERSION}.tar.gz

############
# POSTGRES #
############
FROM postgres:14.1-bullseye
ARG UPSTREAM_VERSION
RUN apt update && apt install -y systemctl selinux-utils net-tools curl ufw iptables procps sudo cron && \
    curl -sSL https://get.docker.com/ | sh
COPY --from=postgres-migrations /usr/src/app/web3signer-${UPSTREAM_VERSION}/slashing-protection/src/main/resources/migrations/postgresql/* /docker-entrypoint-initdb.d/
CMD ["postgres"]