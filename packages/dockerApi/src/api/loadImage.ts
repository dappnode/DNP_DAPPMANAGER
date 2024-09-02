import { docker } from "./docker.js";

/**
 * Load .tar.xz image sending it to the docker daemon
 */
export async function loadImage(imagePath: string, onProgress?: (event: DockerLoadProgress) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    // Must disable quiet flag to receive progress updates
    docker.loadImage(imagePath, { quiet: "0" }, (err, stream) => {
      if (err) reject(err);
      else
        docker.modem.followProgress(
          stream as NodeJS.ReadableStream,
          function onFinished(err: Error | null): void {
            if (err) reject(err);
            else resolve();
          },

          onProgress || ((): void => {})
        );
    });
  });
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
