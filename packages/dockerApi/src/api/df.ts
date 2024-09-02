import memoize from "memoizee";
import { docker } from "./docker.js";

// Result is cached for 15s + it only ran once at a time (like runOnlyOneReturnToAll)
const dockerDfMemo = memoize(() => docker.df(), {
  promise: true,
  maxAge: 5000
});

/**
 * Calls docker system df -v
 * NOTE: Result is cached for 15s + it only ran once at a time,
 * resolving multiple calls with the value (like runOnlyOneReturnToAll)
 */
export async function dockerDf(options?: { noCache: boolean }): Promise<DockerApiSystemDfReturn> {
  if (options && options.noCache) return await docker.df();
  else return await dockerDfMemo();
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
