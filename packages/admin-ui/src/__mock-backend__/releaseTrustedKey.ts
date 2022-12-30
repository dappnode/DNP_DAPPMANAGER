import { Routes, TrustedReleaseKey } from "@dappnode/common";

const initialTrustedKey: TrustedReleaseKey = {
  name: "DAppNode Association",
  signatureProtocol: "ECDSA_256",
  dnpNameSuffix: ".dnp.dappnode.eth",
  key: "0xf35960302a07022aba880dffaec2fdd64d5bf1c1"
};

const trustedKeys = new Map<string, TrustedReleaseKey>([
  [initialTrustedKey.name, initialTrustedKey]
]);

export const releaseTrustedKey: Pick<
  Routes,
  "releaseTrustedKeyAdd" | "releaseTrustedKeyList" | "releaseTrustedKeyRemove"
> = {
  releaseTrustedKeyAdd: async trustedKey => {
    trustedKeys.set(trustedKey.name, trustedKey);
  },
  releaseTrustedKeyList: async () => Array.from(trustedKeys.values()),
  releaseTrustedKeyRemove: async keyName => {
    trustedKeys.delete(keyName);
  }
};
