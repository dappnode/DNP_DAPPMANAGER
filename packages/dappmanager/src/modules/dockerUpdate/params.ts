export const supportedOs = "debian";
export const supportedArchs = ["amd64", "arm64"];
export const supportedDebianReleases = [
  "buster" as const,
  "bullseye" as const,
  "stretch" as const
];

export const targetDockerEngineVersions: DebianReleaseObj = {
  buster: "20.10.2", // containerd "1.4.3-1"
  bullseye: "20.10.2", // containerd "1.4.3-1"
  stretch: "19.03.8" // containerd "1.2.6-3"
};

export const targetDockerComposeVersion = "1.25.5";

/** Helper type to map debian release to docker version 1:1 */
type DebianReleaseObj = {
  [K in typeof supportedDebianReleases[0]]: string;
};
