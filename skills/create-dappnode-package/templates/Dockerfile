# Replace with the base image you need. If you only wrap upstream software
# pinned by the manifest, pass its version as a build arg (see below).
ARG UPSTREAM_VERSION
FROM upstream/image:${UPSTREAM_VERSION}

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
