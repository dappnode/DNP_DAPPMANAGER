import { Routes, TrustedReleaseKey } from "@dappnode/types";

const initialTrustedKey: TrustedReleaseKey = {
  name: "DAppNode Association",
  signatureProtocol: "ECDSA_256",
  dnpNameSuffix: ".dnp.dappnode.eth",
  key: "0xf35960302a07022aba880dffaec2fdd64d5bf1c1"
};

const trustedKeys = new Map<string, TrustedReleaseKey>([[initialTrustedKey.name, initialTrustedKey]]);

let isDefault = true;

export const releaseTrustedKey: Pick<
  Routes,
  "releaseTrustedKeyAdd" | "releaseTrustedKeyList" | "releaseTrustedKeyRemove" | "releaseTrustedKeyReset"
> = {
  releaseTrustedKeyAdd: async (trustedKey) => {
    trustedKeys.set(trustedKey.name, trustedKey);
    isDefault = false;
  },
  releaseTrustedKeyList: async () => ({
    keys: Array.from(trustedKeys.values()),
    isDefault
  }),
  releaseTrustedKeyRemove: async (keyName, dnpNameSuffix) => {
    if (dnpNameSuffix === undefined || trustedKeys.get(keyName)?.dnpNameSuffix === dnpNameSuffix) {
      trustedKeys.delete(keyName);
      isDefault = false;
    }
  },
  releaseTrustedKeyReset: async () => {
    trustedKeys.clear();
    trustedKeys.set(initialTrustedKey.name, initialTrustedKey);
    isDefault = true;
  }
};
