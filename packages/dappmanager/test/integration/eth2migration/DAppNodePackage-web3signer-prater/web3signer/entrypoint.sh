#!/bin/bash

########
# VARS #
########
KEYFILES_DIR="/opt/web3signer/keyfiles"
mkdir -p "$KEYFILES_DIR"

# Run web3signer binary
# EXTRA FOR INT TEST: 
# - use network host to be able to access API. Original: --slashing-protection-db-url=jdbc:postgresql://postgres:5432/web3signer
# - enable keymanager: --key-manager-api-enabled=true
# - enable debug: --debug=true
exec /opt/web3signer/bin/web3signer --logging=DEBUG --key-store-path="$KEYFILES_DIR" --http-listen-port=9000 --http-listen-host=0.0.0.0 --http-host-allowlist=* eth2 --network=prater --slashing-protection-db-url=jdbc:postgresql://localhost/web3signer --slashing-protection-db-username=postgres --slashing-protection-db-password=password --key-manager-api-enabled=true