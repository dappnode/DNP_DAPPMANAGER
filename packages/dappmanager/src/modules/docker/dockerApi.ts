import Docker from "dockerode";
import memoize from "memoizee";
import { stripDockerApiLogsHeader } from "./utils";

const dockerApi = new Docker({ socketPath: "/var/run/docker.sock" });

export interface DockerApiListContainerOptions {
  all?: boolean; // Return all containers. By default, only running (false)
  limit?: number; // Return this number of most recently created containers, including non-running ones.
  size?: boolean; // Return the size of container as fields SizeRw and SizeRootFs. (false)
  filters?: {
    ancestor?: string; // "(<image-name>[:<tag>], <image id>, or <image@digest>)";
    before?: string; // "(<container id> or <container name>)";
    expose?: string; // "(<port>[/<proto>]|<startport-endport>/[<proto>])";
    exited?: string; // "<int> containers with exit code of <int>";
    health?: string; // "(starting|healthy|unhealthy|none)";
    // MUST be an array of: [byId]
    id?: string[]; // "<ID> a container's ID";
    isolation?: string; // "(default|process|hyperv) (Windows daemon only)";
    "is-task"?: string; //"(true|false)";
    label?: string; // "key or label='key=value' of a container label";
    // MUST be an array of: [byName]
    name?: string[]; // "<name> a container's name";
    network?: string; // "(<network id> or <network name>)";
    publish?: string; // "(<port>[/<proto>]|<startport-endport>/[<proto>])";
    since?: string; // "(<container id> or <container name>)";
    status?: string; // "(created|restarting|running|removing|paused|exited|dead)";
    volume?: string; // "(<volume name> or <mount point destination>)";
  };
}

export interface DockerApiListImagesOptions {
  /**
   * Show all images. Only images from a final layer (no children) are shown by default.
   */
  all?: boolean;
  /**
   * A JSON encoded value of the filters (a map[string][]string) to process on the images list. Available filters:
   */
  filters?: {
    /**
     * (<image-name>[:<tag>], <image id> or <image@digest>),
     */
    before?: string;
    dangling?: {};
    /**
     * key or label="key=value" of an image label
     */
    label?: string[];
    /**
     * (<image-name>[:<tag>])
     * Partial RepoTag, i.e. "dappmanager.dnp.dappnode.eth"
     */
    reference?: string[];
    /**
     * (<image-name>[:<tag>], <image id> or <image@digest>)
     */
    since?: string;
  };
  /**
   * Show digest information as a RepoDigests field on each image
   */
  digests?: boolean;
}

export function dockerList(
  options: DockerApiListContainerOptions
): Promise<Docker.ContainerInfo[]> {
  // Change all default value from false to true
  return dockerApi.listContainers({ all: true, ...options });
}

export interface DockerApiSystemDfReturn {
  LayersSize: number; // 1092588;
  Images: {
    Id: string; // "sha256:2b8fd9751c4c0f5dd266fcae00707e67a2545ef34f9a29354585f93dac906749";
    ParentId: string; // "";
    RepoTags: string[]; // ["busybox:latest"];
    RepoDigests: string[]; // ["busybox@sha256:a59906e33509d14c036c8678d687bd4eec81ed7c4b8ce907b888c607f6a1e0e6"];
    Created: number; // 1466724217;
    Size: number; // 1092588;
    SharedSize: number; // 0;
    VirtualSize: number; // 1092588;
    Labels: { [labelName: string]: string };
    Containers: number; // 1;
  }[];
  Containers: {
    Id: string; // "e575172ed11dc01bfce087fb27bee502db149e1a0fad7c296ad300bbff178148";
    Names: string[]; // ["/top"];
    Image: string; // "busybox";
    ImageID: string; // "sha256:2b8fd9751c4c0f5dd266fcae00707e67a2545ef34f9a29354585f93dac906749";
    Command: string; // "top";
    Created: number; // 1472592424;
    SizeRootFs: number; // 1092588;
    Labels: { [labelName: string]: string };
    State: string; // "exited";
    Status: string; // "Exited (0) 56 minutes ago";
    HostConfig: {
      NetworkMode: string; // "default";
    };
    NetworkSettings: {
      Networks: {
        bridge: {
          IPAMConfig: null;
          Links: null;
          Aliases: null;
          NetworkID: string; // "d687bc59335f0e5c9ee8193e5612e8aee000c8c62ea170cfb99c098f95899d92";
          EndpointID: string; // "8ed5115aeaad9abb174f68dcf135b49f11daf597678315231a32ca28441dec6a";
          Gateway: string; // "172.18.0.1";
          IPAddress: string; // "172.18.0.2";
          IPPrefixLen: number; // 16;
          IPv6Gateway: string; // "";
          GlobalIPv6Address: string; // "";
          GlobalIPv6PrefixLen: number; // 0;
          MacAddress: string; // "02:42:ac:12:00:02";
        };
      };
    };
    Mounts: {
      Type: string; // "volume";
      Name: string; // "test_data";
      Source: string; // "/var/lib/docker/volumes/test_data/_data";
      Destination: string; // "/usr/src";
      Driver: string; // "local";
      Mode: string; // "rw";
      RW: boolean; // true;
      Propagation: string; // "";
    }[];
  }[];
  Volumes: {
    CreatedAt: string; // "2019-12-19T16:24:21+01:00"
    Name: string; // "my-volume";
    Driver: string; // "local";
    Mountpoint: string; // "/var/lib/docker/volumes/my-volume/_data";
    Labels: null | { [labelName: string]: string };
    Scope: string; // "local";
    Options: null | { device: string; o: string; type: string };
    UsageData: {
      Size: number; // 10920104;
      RefCount: number; // 2;
    };
  }[];
}

// Result is cached for 15s + it only ran once at a time (like runOnlyOneReturnToAll)
const dockerApiDfMemo = memoize(() => dockerApi.df(), {
  promise: true,
  maxAge: 5000
});

/**
 * Calls docker system df -v
 * NOTE: Result is cached for 15s + it only ran once at a time,
 * resolving multiple calls with the value (like runOnlyOneReturnToAll)
 */
export async function dockerDf(options?: {
  noCache: boolean;
}): Promise<DockerApiSystemDfReturn> {
  if (options && options.noCache) return await dockerApi.df();
  else return await dockerApiDfMemo();
}

export function dockerVolumeInspect(
  volumeName: string
): Promise<Docker.VolumeInspectInfo> {
  const volume = dockerApi.getVolume(volumeName);
  return volume.inspect();
}

interface DockerInfoArchive {
  name: string; // "gzip"
  size: string; // 12
  mode: string; // 134218239
  mtime: string; // "2019-10-21T15:39:33+02:00"
  linkTarget: string; // "/bin/busybox"
}

/**
 * Get information about files in a container
 * Both if the container is not found of the path is not existant,
 * a 404 error will be returned
 * Takes ~ 100 ms, both in success and failure
 * @param id "89ab6595e6c5dd321efb94afdfa69c5682b21505108edadeb488832014c32de9"
 * @param path "bin/gzip"
 * @returns path stats: {
 *   name: 'gzip',
 *   size: 12,
 *   mode: 134218239,
 *   mtime: '2019-10-21T15:39:33+02:00',
 *   linkTarget: '/bin/busybox'
 * }
 */
export async function dockerInfoArchive(
  id: string,
  path: string
): Promise<DockerInfoArchive> {
  const container = dockerApi.getContainer(id);
  const res = await container.infoArchive({ path });
  const headers = res.headers;
  const pathStatBase64 =
    headers["x-docker-container-path-stat"] ||
    headers["X-DOCKER-CONTAINER-PATH-STAT"];
  const pathStatString = Buffer.from(pathStatBase64, "base64").toString(
    "ascii"
  );
  return JSON.parse(pathStatString);
}

interface DockerApiListVolumesOptions {
  dangling?: boolean; // When set to true (or 1), returns all volumes that are not in use by a container. When set to false (or 0), only volumes that are in use by one or more containers are returned.
  driver?: string[]; // <volume-driver-name> Matches volumes based on their driver.
  label?: string[]; // "key or label='key=value' of a container label";
  // MUST be an array of: [byName]
  name?: string[]; // "<name> a container's name";
}

interface DockerVolumeListItem {
  CreatedAt: string; // "2019-12-10T11:54:22+01:00";
  Driver: string; // "local";
  Labels: { [labelKey: string]: string }; // { "com.docker.compose.version": "1.22.0" };
  Mountpoint: string; // "/var/lib/docker/volumes/nginx.dnp.dappnode.eth-data/_data";
  Name: string; // "nginx.dnp.dappnode.eth-data";
  Options: null | { device: string; o: string; type: string };
  // { device: "/demo/Code/dappnode/test/compose-test/data", o: "bind", type: "none" },
  Scope: string; // "local";
}

export async function dockerVolumesList(
  options?: DockerApiListVolumesOptions
): Promise<DockerVolumeListItem[]> {
  const { Volumes } = await dockerApi.listVolumes({ filters: options });
  // Return is not correctly typed, casting to actual tested values
  return Volumes as DockerVolumeListItem[];
}

interface LogOptions {
  // Return logs from stdout
  stdout?: boolean;
  // Return logs from stderr
  stderr?: boolean;
  // Add timestamps to every log line
  timestamps?: boolean;
  // Only return this number of log lines from the end of the logs.
  // Specify as an integer or all to output all log lines. Default "all"
  tail?: number;
  // Only return logs since this time, as a UNIX timestamp. Default 0
  since?: number;
  // Only return logs before this time, as a UNIX timestamp. Default 0
  until?: number;
}

/**
 * Returns container's logs as a string with escape codes
 * @param containerNameOrId
 */
export async function logContainer(
  containerNameOrId: string,
  options?: LogOptions
): Promise<string> {
  const container = dockerApi.getContainer(containerNameOrId);
  const res = await container.logs({ stdout: true, stderr: true, ...options });
  // Return is incorrectly typed as NodeJS.ReadableStream, but it's string
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const data: string = (res as any) || "";

  // Remove prepended bytes added to each line by the docker API
  return stripDockerApiLogsHeader(data);
}

/**
 * Inspect container
 * @param containerNameOrId
 */
export async function containerInspect(
  containerNameOrId: string
): Promise<Docker.ContainerInspectInfo> {
  const container = dockerApi.getContainer(containerNameOrId);
  return await container.inspect();
}

/**
 * List docker images
 * @param options Example:
 * options = {
 *   filters: {
 *     reference: ["dappmanager.dnp.dappnode.eth"]
 *   }
 * }
 */
export async function imagesList(
  options?: DockerApiListImagesOptions
): Promise<Docker.ImageInfo[]> {
  return dockerApi.listImages(options);
}

/**
 * Remove a docker image
 * @param imageNameOrId "sha256:ed6467f4660f70714e8babab7b2d360596c0b074d296f92bf6514c8e95cd591a"
 */
export async function imageRemove(imageNameOrId: string): Promise<void> {
  const image = dockerApi.getImage(imageNameOrId);
  await image.remove();
}

interface DockerLoadProgress {
  status: string; // "Loading layer";
  progressDetail: {
    current: number; // 221151232;
    total: number; // 536990720;
  };
  progress: string; // "[====================>                              ]  221.2MB/537MB";
  id: string; // "32c9b213197b";
}

/**
 * Load .tar.xz image sending it to the docker daemon
 * TODO: Get progress
 * @param imagePath
 */
export async function loadImage(
  imagePath: string,
  onProgress?: (event: DockerLoadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Must disable quiet flag to receive progress updates
    dockerApi.loadImage(imagePath, { quiet: "0" }, (err, stream) => {
      if (err) reject(err);
      else
        dockerApi.modem.followProgress(
          stream,
          function onFinished(err: Error): void {
            if (err) reject(err);
            else resolve();
          },
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onProgress || ((): void => {})
        );
    });
  });
}
