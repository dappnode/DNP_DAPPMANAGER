import { NodeArch } from "../../types";

export class NoImageForArchError extends Error {
  constructor(architecture: NodeArch) {
    super(`No image for architecture: ${architecture}`);
  }
}
