#!/bin/bash

# Paths
AUTH_TOKEN_DIR="/root/.eth2validators"
AUTH_TOKEN_FILE="${AUTH_TOKEN_DIR}/auth-token"
TOKEN=""

# Generate JWT if does not exist already
#if [ ! -f "${AUTH_TOKEN_FILE}" ]; then
#    echo "[INFO] generating JWT..."
#    mkdir -p "${AUTH_TOKEN_DIR}"
#    # --wallet-dir value   Path to a wallet directory on-disk for Prysm validator accounts (default: "/root/.eth2validators/prysm-wallet-v2")
#    validator web generate-auth-token --wallet-dir=${AUTH_TOKEN_DIR} --accept-terms-of-use || { echo "[ERROR] failed to generate JWT"; exit 1; }
#fi

# Print token
#TOKEN=$(sed -n 2p ${AUTH_TOKEN_FILE}) || { echo "[ERROR] failed to read JWT"; exit 1; }
#echo "[INFO] successfully detected JWT: ${TOKEN}"

# Check if the token exists and post 
# the url with the token to the dappmanager
#if [ ! -z "$TOKEN" ]; then
#    # Post JWT to dappmanager
#    curl --connect-timeout 5 \
#        --max-time 10 \
#        --retry 5 \
#        --retry-delay 0 \
#        --retry-max-time 40 \
#        -X POST "http://my.dappnode/data-send?key=token&data=http://prysm-prater.dappnode/initialize?token=${TOKEN}" \
#        || { echo "[ERROR] failed to post JWT to dappmanager"; exit 1; }
#else
#    { echo "[ERROR] could not find auth token file"; exit 1; }
#fi

# Check vars 
#[ -z "$BEACON_RPC_PROVIDER" ] && { echo "[ERROR] BEACON_RPC_PROVIDER is not set"; exit 1; } || echo "[INFO] BEACON_RPC_PROVIDER ${BEACON_RPC_PROVIDER}"
#[ -z "$BEACON_RPC_GATEWAY_PROVIDER" ] && { echo "[ERROR] BEACON_RPC_GATEWAY_PROVIDER is not set"; exit 1; } || echo "[INFO] BEACON_RPC_GATEWAY_PROVIDER ${BEACON_RPC_GATEWAY_PROVIDER}"
#[ -z "$GRAFFITI" ] && echo "[WARN] GRAFFITI is not set" || echo "[INFO] GRAFFITI ${GRAFFITI}"

# Must used escaped \"$VAR\" to accept spaces: --graffiti=\"$GRAFFITI\"
exec -c validator \
  --prater \
  --datadir=/root/.eth2 \
  --rpc-host 0.0.0.0 \
  --monitoring-host 0.0.0.0 \
  --beacon-rpc-provider="$BEACON_RPC_PROVIDER" \
  --beacon-rpc-gateway-provider="$BEACON_RPC_GATEWAY_PROVIDER" \
  --wallet-dir=/root/.eth2validators \
  --wallet-password-file=/root/.eth2wallets/wallet-password.txt \
  --write-wallet-password-on-web-onboarding \
  --graffiti="$GRAFFITI" \
  --web \
  --grpc-gateway-host=0.0.0.0 \
  --grpc-gateway-port=80 \
  --accept-terms-of-use \
  ${EXTRA_OPTS}