import { NodeArch } from "../../types";

export class NoImageForArchError extends Error {
  constructor(architecture: NodeArch, message?: string) {
    let errorMessage = `No image for architecture '${architecture}'`;
    if (message) errorMessage += ` - ${message}`;
    super(errorMessage);
  }
}
