import { MockDnp } from "./types";

const dnpName = "trustlines.dnp.dappnode.eth";
const serviceName = dnpName;

export const trustlines: MockDnp = {
  avatar: "https://i.ibb.co/vLBbdGZ/avatar-min.png",

  manifest: {
    name: dnpName,
    version: "0.0.1",
    upstreamVersion: "release4044",
    shortDescription: "Financial inclusion through OS decentralized systems",
    description:
      "The Trustlines Protocol aims to provide the service of “transfer of value” without actually transferring value. This can be accomplished by leveraging networks of mutual-trust. The Trustlines Protocol is being built to support a range of use cases by leveraging existing networks of mutual trust and mapping trust-based relationships onto trustless infrastructure",
    type: "service",
    chain: "ethereum",
    requirements: {
      minimumDappnodeVersion: "0.2.10"
    },
    disclaimer: {
      message: "asdasd"
    },
    backup: [{ name: "config", path: "/config" }],
    style: {
      featuredBackground: "linear-gradient(67deg, #140a0a, #512424)",
      featuredColor: "white"
    },
    author: "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
    contributors: ["Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)"],
    categories: ["Blockchain"],
    links: {
      homepage: "https://github.com/dappnode/DAppNodePackage-trustlines#readme",
      trustlines: "https://trustlines.network",
      explorer: "https://explorelaika.trustlines.foundation"
    },
    repository: {
      type: "git",
      url: "https://github.com/dappnode/DAppNodePackage-trustlines.git"
    },
    bugs: {
      url: "https://github.com/dappnode/DAppNodePackage-trustlines/issues"
    },
    license: "GPL-3.0"
  },

  specialPermissions: [
    {
      name: "Fake permissions of host access",
      details: "Fake permissions that does not mean anything\n\n - **markdown** _test_"
    }
  ],
  userSettings: {
    environment: {
      [serviceName]: { ROLE: "observer", ADDRESS: "", PASSWORD: "" }
    },
    portMappings: {
      [serviceName]: { "30300": "", "30300/udp": "" }
    },
    namedVolumeMountpoints: { data: "", config: "" }
  },

  setupWizard: {
    version: "2",
    fields: [
      {
        id: "role",
        target: {
          type: "environment",
          name: "ROLE"
        },
        title: "Node role",
        description:
          "The Trustlines Network node can operate in three different modes:\n\n  1. **Observer** - for a node without an address that just wants to monitor the activity in the network,\n  2. **Participant** - for those nodes who have/want an address and want to actively broadcast transactions, and\n  3. **Validator** - for those who successfully bid for a [Validator slot](https://medium.com/trustlines-foundation/trustlines-validator-spotlight-deep-dive-on-rewards-economics-and-opportunities-for-validators-ec75f81088a6) during Trustlines Foundation's Validator Auction and will be validating the network.\n\n\nSelect your preferred option on the drop-down menu below. Please note you won't be able to Validate if your address was not whitelisted at the end of the Validator Slots auction.",
        enum: ["observer", "participant", "validator"],
        required: true
      },
      {
        id: "keystore",
        target: {
          type: "fileUpload",
          path: "/config/custom/keys/Trustlines/main-keystore.json"
        },
        title: "Keystore",
        description: "Your Keystore/JSON file containing the private key that you want to use for this node",
        required: true
      },
      {
        id: "keystoreAddress",
        target: {
          type: "environment",
          name: "ADDRESS"
        },
        title: "Public Address",
        description:
          "Public address from the keystore.\nFor validators, you will use this address to seal blocks so it must be an authorized validator address, you can check the valid addresses in [this list](https://github.com/trustlines-protocol/blockchain/blob/1c664ff7d28998b7070c9edb3b325062a5365aad/chain/tlbc/tlbc-spec.json#L11)",
        pattern: "^0x[a-fA-F0-9]{40}$",
        patternErrorMessage: "Must be a valid address (0x1fd16a...)",
        required: true
      },
      {
        id: "keystorePassword",
        target: {
          type: "environment",
          name: "PASSWORD"
        },
        title: "Password",
        description: "Password to unlock the uploaded keystore",
        required: true,
        secret: true
      }
    ]
  },

  installedData: {
    version: ""
  },
  installedContainers: {
    main: {
      state: "exited",
      exitCode: 1
    },
    server: {
      state: "exited",
      exitCode: 2
    }
  }
};
