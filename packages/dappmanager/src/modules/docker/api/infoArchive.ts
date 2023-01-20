import { docker } from "./docker.js";

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
  const container = docker.getContainer(id);
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

export interface DockerInfoArchive {
  name: string; // "gzip"
  size: string; // 12
  mode: string; // 134218239
  mtime: string; // "2019-10-21T15:39:33+02:00"
  linkTarget: string; // "/bin/busybox"
}
