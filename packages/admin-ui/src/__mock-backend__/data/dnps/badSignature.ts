import { MockDnp } from "./types";

export const badSignature: MockDnp = {
  avatar: "https://icon-library.com/images/hacker-icon/hacker-icon-14.jpg",

  manifest: {
    name: "bad-signature.dnp.dappnode.eth",
    version: "0.2.0",
    description: "Mock DNP with bad signature"
  },

  requestDnp: {
    signedSafe: {
      "bad-signature.dnp.dappnode.eth": {
        safe: false,
        message: "Unsafe origin, bad signature"
      }
    },
    signedSafeAll: false
  }
};
