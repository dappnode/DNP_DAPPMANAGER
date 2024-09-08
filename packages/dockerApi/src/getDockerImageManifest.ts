import { shell } from "@dappnode/utils";

interface ImageManifest {
  Config: string; // "f949e7d76d63befffc8eec2cbf8a6f509780f96fb3bacbdc24068d594a77f043.json"
  Layers: string[]; // ["14ec119e6215a169a53a8c9cdfb56ca873e10f2e5ea0a37692bfa71601f18ec7/layer.tar"]
  RepoTags: string[]; // ["package.dnp.dappnode.eth:0.2.0"];
}
export async function getDockerImageManifest(imagePath: string): Promise<ImageManifest[]> {
  return shell(`tar -xOf ${imagePath} manifest.json`).then(JSON.parse);
}
