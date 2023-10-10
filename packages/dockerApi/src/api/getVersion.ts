import { docker } from "./docker.js";

export const dockerEngineVersion = await docker.version();
