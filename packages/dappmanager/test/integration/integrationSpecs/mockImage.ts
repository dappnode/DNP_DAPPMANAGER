import path from "path";
import { testDir } from "../../testUtils";
import shell from "../../../src/utils/shell";
import * as validate from "../../../src/utils/validate";
import { getImageTag } from "../../../src/params";
import { fileURLToPath } from "url";

const dockerContextPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url))
);
const imageTag = "mocktest-dappnode-test-image:0.0.0";

export const mockImageEnvNAME = "NAME";

/**
 * Returns the tag of a mock test image to test DAppNode package features
 * If it's not already in the Docker image cache, it builds it locally
 */
export async function buildMockImage(): Promise<string> {
  if (!(await shell(`docker images -q ${imageTag}`))) {
    await shell(`docker build --tag ${imageTag} ${dockerContextPath}`);
  }
  return imageTag;
}

/**
 * Saves an image correctly tagged with a different name and version
 * @param name "different.dnp.dappnode.eth"
 * @param version "0.2.0"
 * @returns "mock-test.public.dappnode.eth_0.0.1.tar.xz"
 */
export async function saveNewImageToDisk(
  {
    dnpName,
    version,
    serviceNames
  }: { dnpName: string; version: string; serviceNames: string[] },
  dirToSaveTo: string = testDir
): Promise<string> {
  const imageTag = await buildMockImage();

  if (!serviceNames) serviceNames = [dnpName];
  const newImageTags = serviceNames.map(serviceName =>
    getImageTag({ dnpName, serviceName, version })
  );
  for (const newImageTag of newImageTags)
    await shell(["docker", "tag", imageTag, newImageTag]);

  const newImagePath = path.resolve(
    dirToSaveTo,
    `${dnpName}_${version}.tar.xz`
  );
  validate.path(newImagePath);

  await shell(`docker save ${newImageTags.join(" ")} | xz > ${newImagePath}`);
  return newImagePath;
}
