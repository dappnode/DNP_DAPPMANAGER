import dargs from "dargs";
import shell from "../../utils/shell";

type Args = string[];
type Kwargs = { [flag: string]: string | number | boolean | undefined };

function parseKwargs(kwargs?: Kwargs): string[] {
  const definedKwargs = (kwargs || {}) as Parameters<typeof dargs>[0];
  return dargs(definedKwargs, { useEquals: false, ignoreFalse: true });
}

async function execDocker(args: Args, kwargs?: Kwargs): Promise<string> {
  return shell(["docker", ...args, ...parseKwargs(kwargs)]);
}

export function dockerVolumeRm(volumeName: string): Promise<string> {
  return execDocker(["volume", "rm", volumeName], { f: true });
}

export function dockerStart(
  containerNames: string | string[]
): Promise<string> {
  const ids = parseContainerIdArg(containerNames);
  return execDocker(["start", ...ids]);
}

export function dockerStop(
  containerNames: string[],
  options: { time?: number } = {}
): Promise<string> {
  const ids = parseContainerIdArg(containerNames);
  return execDocker(["stop", ...ids], options);
}

export function dockerRm(
  containerNames: string | string[],
  { volumes }: { volumes?: boolean } = {}
): Promise<string> {
  const ids = parseContainerIdArg(containerNames);
  return execDocker(["rm", ...ids], { force: true, volumes });
}

interface ImageManifest {
  Config: string; // "f949e7d76d63befffc8eec2cbf8a6f509780f96fb3bacbdc24068d594a77f043.json"
  Layers: string[]; // ["14ec119e6215a169a53a8c9cdfb56ca873e10f2e5ea0a37692bfa71601f18ec7/layer.tar"]
  RepoTags: string[]; // ["package.dnp.dappnode.eth:0.2.0"];
}
export function dockerImageManifest(
  imagePath: string
): Promise<ImageManifest[]> {
  return shell(`tar -xOf ${imagePath} manifest.json`).then(JSON.parse);
}

// File manager, copy command

export function dockerCopyFileTo(
  id: string,
  fromPath: string,
  toPath: string
): Promise<string> {
  return shell(`docker cp --follow-link ${fromPath} ${id}:${toPath}`);
}

export function dockerCopyFileFrom(
  id: string,
  fromPath: string,
  toPath: string
): Promise<string> {
  return shell(`docker cp --follow-link ${id}:${fromPath} ${toPath}`);
}

export function dockerGetContainerWorkingDir(id: string): Promise<string> {
  return shell(`docker inspect --format='{{json .Config.WorkingDir}}' ${id}`);
}

function parseContainerIdArg(containerNames: string | string[]): string[] {
  return Array.isArray(containerNames) ? containerNames : [containerNames];
}
