import semver from "semver";
import { logs } from "../../../logs";
import { dockerContainerRemove } from "../../docker";
import { listContainerNoThrow } from "../../docker/list";

export async function ensureOldPrysmValidatorContainerIsRemoved({
  prysmOldValidatorContainerName,
  newEth2ClientVersion
}: {
  prysmOldValidatorContainerName: string;
  newEth2ClientVersion: string;
}): Promise<void> {
  const container = await listContainerNoThrow({
    containerName: prysmOldValidatorContainerName
  });

  if (container && semver.lt(container.version, newEth2ClientVersion)) {
    logs.warn(
      "old prysm container still exists, attempint to delete it once again"
    );
    await dockerContainerRemove(prysmOldValidatorContainerName);
  }
}
