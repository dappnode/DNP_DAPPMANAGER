FROM node:8.9.4-alpine as build

RUN apk add --no-cache git python build-base bind-tools docker

WORKDIR /usr/src/app

ADD ens.js .
ADD index.js .
ADD package-lock.json .
ADD package.json . 
ADD entrypoint.sh .

RUN npm install

# This results in a single layer image
FROM node:8.9.4-alpine

RUN apk add --no-cache bind-tools

WORKDIR /usr/src/app

COPY --from=build /usr/src/app /usr/src/app
COPY --from=build /usr/bin/nsupdate /usr/bin/nsupdate
COPY --from=build /usr/bin/docker /usr/bin/docker

COPY ./dns_updater.sh /etc/periodic/1min/dns_updater
RUN chmod +x /etc/periodic/1min/dns_updater
RUN crontab -l | { cat; echo "*       *       *       *       *       run-parts   /etc/periodic/1min"; } | crontab -

ENTRYPOINT /usr/src/app/entrypoint.sh
