ARG UPSTREAM_VERSION

FROM consensys/teku:$UPSTREAM_VERSION

ENV JAVA_OPTS="-Xmx4g"

ENTRYPOINT [ "sh", "-c", "exec /opt/teku/bin/teku \
  --network=prater \
  --data-base-path=/opt/teku/data \
  --eth1-endpoint=\"$HTTP_WEB3PROVIDER\" \
  --validators-external-signer-url=\"$HTTP_WEB3SIGNER\" \
  --validators-external-signer-public-keys=\"$HTTP_WEB3SIGNER\"/api/v1/eth2/publicKeys \
  --p2p-port=9000 \
  --rest-api-enabled=true \
  --rest-api-docs-enabled=true \
  --initial-state=\"$INITIAL_STATE\" \
  --log-destination=CONSOLE \
  $EXTRA_OPTS" ]