import { docker } from "./docker.js";

/**
 * Remove a docker image
 * @param imageNameOrId "sha256:ed6467f4660f70714e8babab7b2d360596c0b074d296f92bf6514c8e95cd591a"
 */
export async function imageRemove(imageNameOrId: string): Promise<void> {
  const image = docker.getImage(imageNameOrId);
  await image.remove();
}
