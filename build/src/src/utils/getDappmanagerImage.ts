import shell from "./shell";

// If the DAPPMANAGER image changes, this node app MUST be reseted
let cacheDappmanagerImage = "";

export default async function getDappmanagerImage(): Promise<string> {
  if (cacheDappmanagerImage) return cacheDappmanagerImage;
  const res = await shell(
    `docker ps --filter "name=dappmanager.dnp.dappnode.eth" --format "{{.Image}}"`
  );
  if (!res) throw Error("No image found for dappmanager.dnp.dappnode.eth");
  const dappmanagerImage = res.trim();
  cacheDappmanagerImage = dappmanagerImage;
  return dappmanagerImage;
}
