import downloadAvatar from "./downloadAvatar";

export default async function getAvatar(avatarHash: string) {
  return await downloadAvatar(avatarHash);
}
