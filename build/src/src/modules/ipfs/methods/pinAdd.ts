import ipfs, { timeoutMs } from "../ipfsSetup";
import { logs } from "../../../logs";

/**
 * [ { hash: 'QmNqDvqAyy3pN3PvymB6chM7S1FgYyive8LosVKUuaDdfd' } ]
 */
type IpfsPinAddResult = { hash: string }[];

/**
 * Pin a hash
 * @param hash "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
 */
export async function pinAdd({
  hash
}: {
  hash: string;
}): Promise<IpfsPinAddResult> {
  return await ipfs.pin.add(hash, { timeout: timeoutMs });
}

/**
 * Pin a hash but do not throw on error
 * @param hash "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
 */
export async function pinAddNoThrow({ hash }: { hash: string }): Promise<void> {
  await pinAdd({ hash }).catch((e: Error) =>
    logs.error(`Error pinning hash ${hash}`, e)
  );
}
