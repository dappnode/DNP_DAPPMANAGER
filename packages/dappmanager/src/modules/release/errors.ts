export class NoImageForArchError extends Error {
  constructor(architecture: string) {
    super(`No image for architecture: ${architecture}`);
  }
}
