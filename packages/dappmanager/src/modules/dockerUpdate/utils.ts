import semver from "semver";
import {
  DockerVersionsScript,
  HostInfoScript,
  UpdateRequirement,
  DockerUpdateStatus
} from "@dappnode/common";
import { sanitizeVersion } from "../../utils/sanitizeVersion";
import {
  supportedOs,
  supportedArchs,
  supportedDebianReleases,
  targetDockerEngineVersions,
  targetDockerComposeVersion
} from "./params";

// Docker engine

export function parseDockerEngineRequirements(
  info: HostInfoScript
): DockerUpdateStatus {
  const {
    os,
    architecture,
    versionCodename,
    dockerServerVersion,
    dockerCliVersion,
    dockerComposeVersion
  } = info;

  const dockerServerVersionCleaned = sanitizeVersion(dockerServerVersion);
  const dockerCliVersionCleaned = sanitizeVersion(dockerCliVersion);

  const isOsSupported = supportedOs === os;
  const isArchSupported = supportedArchs.some(arch => arch === architecture);
  const debianRelease = supportedDebianReleases.find(
    relVer => relVer === versionCodename
  );
  const targetDockerVersion =
    debianRelease && targetDockerEngineVersions[debianRelease];
  const isDockerUpdated =
    targetDockerVersion &&
    semver.gte(dockerServerVersionCleaned, targetDockerVersion);
  const isDockerEngineVersionsSync = semver.eq(
    dockerServerVersionCleaned,
    dockerCliVersionCleaned
  );
  const isComposeUpdated = semver.gte(
    dockerComposeVersion,
    targetDockerComposeVersion
  );

  const supportedArchsStr = supportedArchs.join(", ");
  const supportedDebianReleasesStr = supportedDebianReleases.join(", ");

  const requirements: UpdateRequirement[] = [
    {
      title: "Operating System (OS)",
      isFulFilled: isOsSupported,
      message: isOsSupported
        ? `OS ${os} supported`
        : `OS ${os} not supported. Allowed: ${supportedOs}`
    },
    {
      title: "OS Architecture",
      isFulFilled: isArchSupported,
      message: isArchSupported
        ? `Arch ${architecture} supported`
        : `Arch ${architecture} not supported. Allowed: ${supportedArchsStr}`
    },
    {
      title: "OS release",
      isFulFilled: Boolean(debianRelease),
      message: debianRelease
        ? `Debian release ${debianRelease} supported`
        : `Debian release ${versionCodename} not supported. Allowed ${supportedDebianReleasesStr}`
    },

    // docker server version and docker cli versions should always be the same
    // If they are not the same the best solution from online forums is to reboot the host
    // and hope that the versions become the same again
    {
      title: "Docker engine versions synchronized",
      isFulFilled: isDockerEngineVersionsSync,
      message: isDockerEngineVersionsSync
        ? `Docker server and Docker CLI versions are syncronized`
        : `Docker server version ${dockerServerVersion} and Docker CLI version ${dockerCliVersion} are not syncronized. Reboot the machine`
    },
    {
      title: "Docker compose compatibility",
      isFulFilled: isComposeUpdated,
      message: isComposeUpdated
        ? `Docker compose is updated`
        : `You must update Docker compose first. Current version ${dockerComposeVersion}, target version ${targetDockerComposeVersion}`
    }
  ];

  return {
    updated: Boolean(isDockerUpdated),
    version: dockerServerVersion,
    requirements
  };
}

export function parseDockerComposeRequirements(
  info: DockerVersionsScript
): DockerUpdateStatus {
  const { dockerComposeVersion } = info;

  const dockerComposeVersionCleaned = semver.clean(dockerComposeVersion, {
    loose: true
  });

  if (!dockerComposeVersionCleaned)
    throw Error("Docker compose version not allowed by semver");

  const isComposeUpdated = semver.gte(
    dockerComposeVersionCleaned,
    targetDockerComposeVersion
  );

  return {
    updated: Boolean(isComposeUpdated),
    version: dockerComposeVersion,
    requirements: []
  };
}
