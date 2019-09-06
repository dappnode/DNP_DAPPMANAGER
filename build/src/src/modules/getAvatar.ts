import downloadAvatar from "./downloadAvatar";

export default async function getAvatar(avatarHash: string): Promise<string> {
  return await downloadAvatar(avatarHash);
}
