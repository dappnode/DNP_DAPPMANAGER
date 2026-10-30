#!/bin/sh
set -eu

# A detached, network-less worker retains the manager's configuration mounts and
# Docker socket, and survives stopping the manager. Its journal is a named volume.
case "${1:-}" in plan|apply|resume|rollback|status) ;; *)
  echo "Usage: $0 plan|apply|resume|rollback|status" >&2; exit 2 ;;
esac
[ "$#" -eq 1 ] || exit 2
manager=DAppNodeCore-dappmanager.dnp.dappnode.eth
runner=DAppNodeTool-network-migration
state_volume=${DAPPNODE_NETWORK_MIGRATION_STATE_VOLUME:-dappnode-network-migration-v1}
image=${DAPPNODE_NETWORK_MIGRATION_IMAGE:-$(docker inspect --format '{{.Image}}' "$manager")}

if docker inspect "$runner" >/dev/null 2>&1; then
  [ "$(docker inspect --format '{{index .Config.Labels "dappnode.network-migration"}}' "$runner")" = 1 ] || {
    echo "Container name $runner is already used by another workload" >&2; exit 1;
  }
  [ "$(docker inspect --format '{{.State.Running}}' "$runner")" = false ] || {
    echo "A migration worker is already running; inspect it with docker logs $runner" >&2; exit 1;
  }
  docker rm "$runner" >/dev/null
fi
docker volume create "$state_volume" >/dev/null
docker run --detach --name "$runner" --network none \
  --label dappnode.network-migration=1 --env "MIGRATION_CONTAINER=$runner" \
  --volumes-from "$manager" --mount "type=volume,src=$state_volume,dst=/state" \
  "$image" node /usr/src/app/scripts/docker-network-migration.ts "$1"
docker logs --follow "$runner"
exit "$(docker inspect --format '{{.State.ExitCode}}' "$runner")"
