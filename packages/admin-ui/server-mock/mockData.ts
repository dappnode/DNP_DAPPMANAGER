import {
  UserSettings,
  PackageContainer,
  RequestedDnp,
  DirectoryItem,
  SpecialPermission,
  SetupWizard,
  ChainData,
  PackageDetailData
} from "../src/common/types";

function getDescription(manifest: {
  shortDescription?: string;
  description: string;
}) {
  return manifest.shortDescription || manifest.description;
}

export const coreName = "core.dnp.dappnode.eth";

/**
 * Avatars
 * =======
 */

const bitcoinAvatar = "https://en.bitcoin.it/w/images/en/2/29/BC_Logo_.png";
const lightningNetworkAvatar = "https://i.ibb.co/Twjv2f3/ln.png";
const raidenAvatar = "https://i.ibb.co/Y0YzyrG/raiden300-min.png";
const raidenTestnetAvatar = "https://i.ibb.co/2ynnctD/raiden-testnet-300.png";
const trustlinesAvatar = "https://i.ibb.co/vLBbdGZ/avatar-min.png";

/**
 * Metadatas
 * =========
 */

/**
 * Lightning network
 */

const lightningNetworkMetadata = {
  name: "lightning-network.dnp.dappnode.eth",
  version: "0.0.3",
  upstreamVersion: "0.6.1-beta",
  shortDescription: "Scalable, instant Bitcoin/Blockchain transactions",
  description:
    "The Lightning Network DAppNodePackage (lnd + RTL). The Lightning Network is a decentralized system for instant, high-volume micropayments that removes the risk of delegating custody of funds to trusted third parties.",
  avatar: "/ipfs/QmVrjV1ANxjYVqRJzycYKcCUAH8nU337UsMVir1CnZYNa8",
  type: "service",
  backup: [{ name: "data", path: "/root/.lnd/data" }],
  style: {
    featuredBackground: "linear-gradient(67deg, #090909, #2f1354)",
    featuredColor: "#eee"
  },
  author:
    "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
  contributors: [
    "Abel Boldú (@vdo)",
    "Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)"
  ],
  categories: ["Payment channels", "Economic incentive"],
  keywords: ["bitcoin", "btc", "lightning network", "lnd"],
  links: {
    homepage:
      "https://github.com/dappnode/DAppNodePackage-LightningNetwork#readme",
    ui: "http://lightning-network.dappnode",
    api: "http://lightning-network.dappnode:8080",
    another: "http://lightning-network.dappnode"
  },
  repository: {
    type: "git",
    url: "git+https://github.com/dappnode/DAppNodePackage-LightningNetwork.git"
  },
  bugs: {
    url: "https://github.com/dappnode/DAppNodePackage-LightningNetwork/issues"
  },
  disclaimer: {
    message:
      "This software is experimental, presented 'as is' and inherently carries risks. By installing it, you acknowledge that DAppNode Association has done its best to mitigate these risks and accept to waive any liability or responsibility for DAppNode in case of any shortage, discrepancy, damage, loss or destruction of any digital asset managed within this DAppNode package.\n\nThis package stores private keys, which will be stored in your DAppNode. Neither DAppNode Association nor the developers of this software can have access to your private key, nor help you recover it if you lose it. \n\nYou are solely responsible for keeping your private keys and password safe and to perform secure backups, as well as to restrict access to your computer and other equipment. To the extent permitted by applicable law, you agree to be responsible for all activities that have been conducted from your account. You must take all necessary steps to ensure that your private key, password, and/or recovery phrase remain confidential and secured."
  },
  license: "GPL-3.0",
  dependencies: {
    "bitcoin.dnp.dappnode.eth": "latest"
  }
};

const lightningNetworkSetupWizard: SetupWizard = {
  version: "2",
  fields: [
    {
      id: "rtlPassword",
      target: {
        type: "environment",
        name: "RTL_PASSWORD"
      },
      title: "RTL password",
      description: "Password to protect RTL",
      pattern: "^.{8,}$",
      patternErrorMessage: "Must be at least 8 characters long",
      secret: true,
      required: true
    },
    {
      id: "network",
      target: {
        type: "environment",
        name: "NETWORK"
      },
      title: "Network",
      description: "Choose which network to connect to",
      enum: ["mainnet", "testnet"]
    },
    {
      id: "onlyTestnet",
      target: {
        type: "environment",
        name: "ONLY_TESTNET"
      },
      title: "Only testnet",
      description:
        "Mock variable that should only be visible if `network = testnet`",
      required: true,
      if: {
        network: { enum: ["testnet"] }
      }
    }
  ]
};

const lightningNetworkSetup: UserSettings = {
  portMappings: { "9735": "9735" },
  namedVolumeMountpoints: { lndconfig_data: "" },
  environment: {
    RTL_PASSWORD: "",
    RPCUSER: "dappnode",
    RPCPASS: "dappnode",
    BITCOIND_HOST: "my.bitcoin.dnp.dappnode.eth",
    NETWORK: "mainnet",
    ALIAS: "",
    COLOR: "#5ACDC5",
    EXT_IP: ""
  }
};

export const lightningNetworkUserSettingsInstalled: UserSettings = {
  portMappings: { "9735": "9735" },
  namedVolumeMountpoints: { lndconfig_data: "/usr/media_0" },
  environment: {
    ...lightningNetworkSetup.environment,
    RTL_PASSWORD: "new-secret-password"
  }
};

const lightningNetworkGettingStarted = `
**Accessing the ADMIN UI**\n\nOnce the node is synced, you can access your LN node [admin UI here](https://lightning-network.dappnode)\n\n**How to download macaroons**\n\nUsually Lightning Network applications require files called *macaroons* for authorizations to perform operations on the LND node. There are many types depending on the level of access.\nTo download the admin macaroon, you should go to the Admin panel of DAppnode: \nPackages -> My packages -> Lightning-Network -> File manager\nThen input in the 'Download from DNP' field:\n\`\`\`\n/config/data/chain/bitcoin/mainnet/admin.macaroon\n\`\`\`\n\n**How to use Joule extension with DAppNode**\n\nJoule is an extension available for many browsers which lets you use your node to make payments, invoices, open channels and more. Check the website: https://lightningjoule.com/\n* To run Joule, first you need to download these macaroons in a safe folder, as described above:\n\`\`\`\n/config/data/chain/bitcoin/mainnet/admin.macaroon\n/config/data/chain/bitcoin/mainnet/readonly.macaroon\n\`\`\`\n* When asked on the type of node, select Remote and then enter the following url: \n   https://lightning-network.dappnode:8080\n   * You will need to accept the SSL certificate in the next step\n* Upload the macaroons, choose a password to encrypt the data, and you're ready to go!\n* **Enjoy!** But be aware both LND and RTL are beta software .Only use funds you can afford to lose.  Don't be completely #Reckless ;) \n\n <img src="https://i.imgur.com/66P7Aei.png" width="500px" height="100%"> \n\n ![](https://i.imgur.com/66P7Aei.png) \n\n\n ![](https://i.ibb.co/cvw9f9K/download.png)


**Blockquotes**

As Kanye West said:

> We're living the future so
> the present is our past.      


**Syntax highlighting**

\`\`\`js
function fancyAlert(arg) {
  if(arg) {
    $.facebox({div:'#foo'})
  }
}
\`\`\`


**Task Lists**
- [x]  this is a complete item
- [ ]  this is an incomplete item


**Tables**

First Header | Second Header
------------ | -------------
Content from cell 1 | Content from cell 2
Content in the first column | Content in the second column

        `;

/**
 * Raiden
 */

const raidenMetadata = {
  name: "raiden.dnp.dappnode.eth",
  version: "0.0.1",
  upstreamVersion: "0.100.3",
  shortDescription: "Fast, cheap, scalable token transfers for Ethereum",
  description:
    "The Raiden Network is an off-chain scaling solution, enabling near-instant, low-fee and scalable payments. It’s complementary to the Ethereum blockchain and works with any ERC20 compatible token. \n\n\n **Getting started** \n\n Once you have installed the Raiden DAppNode Package you **must** upload your own keystore. Go to this [getting started guide](https://github.com/dappnode/DAppNodePackage-raiden) to learn how to do so.  \n\n\n All set? Check out the [documentation and introductory guides](https://raiden-network.readthedocs.io/en/stable/#how-to-get-started) to quickly get started doing payments.",
  avatar: "/ipfs/QmaqgLyZXpETXYzhWcebNJnh6vPs4WqiCJbZY3EY1fXqer",
  type: "service",
  dependencies: {},
  requirements: {
    minimumDappnodeVersion: "0.2.4"
  },
  backup: [{ name: "keystore", path: "/root/.raiden/keystore" }],
  style: {
    featuredBackground: "linear-gradient(67deg, #000000, #2f3c3e)",
    featuredColor: "white",
    featuredAvatarFilter: "invert(1)"
  },
  author:
    "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
  contributors: ["Abel Boldú (@vdo)"],
  homepage: {
    homepage: "https://github.com/dappnode/DAppNodePackage-raiden#readme"
  },
  repository: {
    type: "git",
    url: "https://github.com/dappnode/DAppNodePackage-raiden.git"
  },
  bugs: {
    url: "https://github.com/dappnode/DAppNodePackage-raiden/issues"
  },
  disclaimer: {
    message:
      "This software is experimental, presented 'as is' and inherently carries risks. By installing it, you acknowledge that DAppNode Association has done its best to mitigate these risks and accept to waive any liability or responsibility for DAppNode in case of any shortage, discrepancy, damage, loss or destruction of any digital asset managed within this DAppNode package.\n\nThis package stores private keys, which will be stored in your DAppNode. Neither DAppNode Association nor the developers of this software can have access to your private key, nor help you recover it if you lose it. \n\nYou are solely responsible for keeping your private keys and password safe and to perform secure backups, as well as to restrict access to your computer and other equipment. To the extent permitted by applicable law, you agree to be responsible for all activities that have been conducted from your account. You must take all necessary steps to ensure that your private key, password, and recovery phrase remain confidential and secured. \n\nThis is an Alpha version of experimental open source software released as a test version under an MIT license and may contain errors and/or bugs. No guarantee or representations whatsoever is made regarding its suitability (or its use) for any purpose or regarding its compliance with any applicable laws and regulations. Use of the software is at your own risk and discretion and by using the software you acknowledge that you have read this disclaimer, understand its contents, assume all risk related thereto and hereby release, waive, discharge and covenant not to sue Brainbot Labs Establishment or any officers, employees or affiliates from and for any direct or indirect liability resulting from the use of the software as permissible by applicable laws and regulations.\n\nPrivacy Warning: Please be aware, that by using the Raiden Client, \namong others, your Ethereum address, channels, channel deposits, settlements and the Ethereum address of your channel counterparty will be stored on the Ethereum chain, i.e. on servers of Ethereum node operators and ergo are to a certain extent publicly available. The same might also be stored on systems of parties running Raiden nodes connected to the same token network. Data present in the Ethereum chain is very unlikely to be able to be changed, removed or deleted from the public arena.\n\nAlso be aware, that data on individual Raiden token transfers will be made available via the Matrix protocol to the recipient, intermediating nodes of a specific transfer as well as to the Matrix server operators."
  },
  license: "MIT License"
};

const raidenSetupWizard: SetupWizard = {
  version: "2",
  fields: [
    {
      id: "keystore",
      title: "Keystore",
      description: "Keystore with the account to be used in your Raiden node",
      target: {
        type: "fileUpload",
        path: "/usr/src/app"
      }
    },
    {
      id: "keystoreSet",
      title: "Keystore already set",
      description: "Should be hidden",
      target: {
        type: "fileUpload",
        path: "/usr/src/app-set"
      }
    },
    {
      id: "keystorePassword",
      title: "Keystore password",
      description: "Password of the uploaded keystore",
      target: {
        type: "environment",
        name: "RAIDEN_KEYSTORE_PASSWORD"
      }
    },
    {
      id: "keystoreAddress",
      title: "Keystore address",
      description: "Address of the uploaded keystore",
      target: {
        type: "environment",
        name: "RAIDEN_ADDRESS"
      }
    }
  ]
};

const raidenSetup: UserSettings = {
  namedVolumeMountpoints: { data: "" },
  environment: {
    RAIDEN_KEYSTORE_PASSWORD: "",
    RAIDEN_ADDRESS: "",
    EXTRA_OPTS: "--disable-debug-logfile"
  }
};

/**
 * Raiden testnet
 */

const raidenTestnetMetadata = {
  name: "raiden-testnet.dnp.dappnode.eth",
  version: "0.0.2",
  description:
    "The Raiden Network is an off-chain scaling solution, enabling near-instant, low-fee and scalable payments. It’s complementary to the Ethereum blockchain and works with any ERC20 compatible token. \n\n\n **Getting started** \n\n Once you have installed the Raiden DAppNode Package you **must** upload your own keystore. Go to this [getting started guide](https://github.com/dappnode/DAppNodePackage-raiden) to learn how to do so.  \n\n\n All set? Check out the [documentation and introductory guides](https://raiden-network.readthedocs.io/en/stable/#how-to-get-started) to quickly get started doing payments.",
  avatar: "/ipfs/QmaqgLyZXpETXYzhWcebNJnh6vPs4WqiCJbZY3EY1fXqer",
  type: "service",
  author:
    "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
  contributors: ["Abel Boldú (@vdo)", "Eduardo Antuña (@eduadiez)"],
  homepage: {
    WebApplication: "http://raiden-testnet.dappnode/",
    homepage:
      "https://github.com/dappnode/DAppNodePackage-raiden-testnet#readme"
  },
  repository: {
    type: "git",
    url: "http://github.com/dappnode/DAppNodePackage-raiden-testnet.git"
  },
  bugs: {
    url: "https://github.com/dappnode/DAppNodePackage-raiden-testnet/issues"
  },
  license: "GPL-3.0",
  dependencies: {
    "goerli-geth.dnp.dappnode.eth": "latest"
  },
  disclaimer: {
    message:
      "This software is experimental, presented 'as is' and inherently carries risks. By installing it, you acknowledge that DAppNode Association has done its best to mitigate these risks and accept to waive any liability or responsibility for DAppNode in case of any shortage, discrepancy, damage, loss or destruction of any digital asset managed within this DAppNode package.\n\nThis package stores private keys, which will be stored in your DAppNode. Neither DAppNode Association nor the developers of this software can have access to your private key, nor help you recover it if you lose it. \n\nYou are solely responsible for keeping your private keys and password safe and to perform secure backups, as well as to restrict access to your computer and other equipment. To the extent permitted by applicable law, you agree to be responsible for all activities that have been conducted from your account. You must take all necessary steps to ensure that your private key, password, and recovery phrase remain confidential and secured. \n\nThis is an Alpha version of experimental open source software released as a test version under an MIT license and may contain errors and/or bugs. No guarantee or representations whatsoever is made regarding its suitability (or its use) for any purpose or regarding its compliance with any applicable laws and regulations. Use of the software is at your own risk and discretion and by using the software you acknowledge that you have read this disclaimer, understand its contents, assume all risk related thereto and hereby release, waive, discharge and covenant not to sue Brainbot Labs Establishment or any officers, employees or affiliates from and for any direct or indirect liability resulting from the use of the software as permissible by applicable laws and regulations.\n\nPrivacy Warning: Please be aware, that by using the Raiden Client, \namong others, your Ethereum address, channels, channel deposits, settlements and the Ethereum address of your channel counterparty will be stored on the Ethereum chain, i.e. on servers of Ethereum node operators and ergo are to a certain extent publicly available. The same might also be stored on systems of parties running Raiden nodes connected to the same token network. Data present in the Ethereum chain is very unlikely to be able to be changed, removed or deleted from the public arena.\n\nAlso be aware, that data on individual Raiden token transfers will be made available via the Matrix protocol to the recipient, intermediating nodes of a specific transfer as well as to the Matrix server operators."
  }
};

const raidenTestnetSetup: UserSettings = {
  namedVolumeMountpoints: { data: "" },
  environment: {
    RAIDEN_ADDRESS: "",
    RAIDEN_KEYSTORE_PASSWORD: "",
    RAIDEN_ETH_RPC_ENDPOINT: "http://goerli-geth.dappnode:8545",
    RAIDEN_NETWORK_ID: "goerli",
    EXTRA_OPTS: "--disable-debug-logfile"
  }
};

/**
 * Bitcoin
 */

const bitcoinMetadata = {
  name: "bitcoin.dnp.dappnode.eth",
  version: "0.1.3",
  description:
    "The Bitcoin Core daemon (0.18.0). Bitcoind is a program that implements the Bitcoin protocol for remote procedure call (RPC) use.",
  avatar: "/ipfs/QmNrfF93ppvjDGeabQH8H8eeCDLci2F8fptkvj94WN78pt",
  type: "service",
  style: {
    featuredBackground: "linear-gradient(to right, #4b3317, #cb6e00)",
    featuredColor: "white"
  },
  author:
    "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
  contributors: [
    "Abel Boldú (@vdo)",
    "Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)",
    "Loco del Bitcoin <ellocodelbitcoin@gmail.com>"
  ],
  keywords: ["bitcoin", "btc"],
  homepage: {
    homepage: "https://github.com/dappnode/DAppNodePackage-bitcoin#readme"
  },
  repository: {
    type: "git",
    url: "git+https://github.com/dappnode/DAppNodePackage-bitcoin.git"
  },
  bugs: {
    url: "https://github.com/dappnode/DAppNodePackage-bitcoin/issues"
  },
  license: "GPL-3.0"
};

const bitcoinUserSettings: UserSettings = {
  portMappings: { "8333": "8333" },
  namedVolumeMountpoints: {
    bitcoin_data: "",
    bitcoin_data_old: "/dev0/data",
    bitcoin_data_old_legacy: "legacy:/dev1/data"
  },
  environment: {
    BTC_RPCUSER: "dappnode",
    BTC_RPCPASSWORD: "dappnode",
    BTC_TXINDEX: "1",
    BTC_PRUNE: "0"
  }
};

const bitcoinSetupWizard: SetupWizard = {
  version: "2",
  fields: [
    {
      id: "bitcoinData",
      title: "Custom volume data path",
      description:
        "If you want to store the Bitcoin blockchain is a separate drive, enter the absolute path of the location of an external drive.",
      target: {
        type: "namedVolumeMountpoint",
        volumeName: "bitcoin_data"
      }
    },
    {
      id: "bitcoinDataOld",
      title: "Custom volume data old path",
      description:
        "Already set path to test that it's not editable. If you want to store the Bitcoin blockchain is a separate drive, enter the absolute path of the location of an external drive.",
      target: {
        type: "namedVolumeMountpoint",
        volumeName: "bitcoin_data_old"
      }
    },
    {
      id: "bitcoinDataOldLegacy",
      title: "Custom volume data old legacy path",
      description:
        "Already set path to test that it's not editable, with legacy setting. If you want to store the Bitcoin blockchain is a separate drive, enter the absolute path of the location of an external drive.",
      target: {
        type: "namedVolumeMountpoint",
        volumeName: "bitcoin_data_old_legacy"
      }
    },
    {
      id: "bitcoinAllVolumes",
      title: "All volumes",
      description: "This mountpoint selector should affect all named volumes",
      target: {
        type: "allNamedVolumesMountpoint"
      }
    },
    {
      id: "bitcoinName",
      title: "Bitcoin name",
      description: "Useless parameter to test performance",
      target: {
        type: "environment",
        name: "BITCOIN_NAME"
      }
    }
  ]
};

/**
 * Ethchain
 */

const openEthereumMetadata = {
  name: "open-ethereum.dnp.dappnode.eth",
  version: "0.2.6",
  description:
    "Dappnode package responsible for providing the Ethereum blockchain, based on Parity v2.5.8-stable",
  avatar: "/ipfs/QmNdWMzgapc49kpofYFE9M63Snc2dKJ8YQmEmdRU8wPMEg",
  type: "dncore",
  chain: "ethereum",
  upstreamVersion: "v2.5.8-stable",
  author:
    "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
  contributors: [
    "Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)"
  ],
  keywords: ["DAppNodeCore", "Parity", "Mainnet", "Ethereum"],
  links: {
    homepage: "https://your-project-homepage-or-docs.io"
  },
  license: "GLP-3.0"
};

/**
 * Trustlines metadata
 */

const trustlinesMetadata = {
  name: "trustlines.dnp.dappnode.eth",
  version: "0.0.1",
  upstreamVersion: "release4044",
  shortDescription: "Financial inclusion through OS decentralized systems",
  description:
    "The Trustlines Protocol aims to provide the service of “transfer of value” without actually transferring value. This can be accomplished by leveraging networks of mutual-trust. The Trustlines Protocol is being built to support a range of use cases by leveraging existing networks of mutual trust and mapping trust-based relationships onto trustless infrastructure",
  avatar: "/ipfs/QmcpEAc5CsaSD5jc1rkmiGtjtpxDaWDMHUWWh2tUgXFhDC",
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
  author:
    "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
  contributors: [
    "Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)"
  ],
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
};

const trustlinesSpecialPermissions: SpecialPermission[] = [
  {
    name: "Fake permissions of host access",
    details:
      "Fake permissions that does not mean anything\n\n - **markdown** _test_"
  }
];

const trustlinesSetup = {
  environment: { ROLE: "observer", ADDRESS: "", PASSWORD: "" },
  portMapping: { "30300": "", "30300/udp": "" },
  namedVolumeMountpoints: { data: "", config: "" }
};

const trustlinesSetupWizard: SetupWizard = {
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
      description:
        "Your Keystore/JSON file containing the private key that you want to use for this node",
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
};

// Fake is installing package
const isInstallingDnp = "is-installing.dnp.dappnode.eth";
const isInstallingAvatar =
  "https://image.flaticon.com/icons/png/512/18/18229.png";
const isInstallingMetadata = {
  name: isInstallingDnp,
  version: "0.1.0",
  description: "Mock DNP that is installing"
};

// Fake loading error package
const inErrorDnp = "is-on-error.dnp.dappnode.eth";
const inErrorAvatar =
  "https://i.ibb.co/TMHKsQV/error-success-ok-34166614-w-XOz-Jop-GD.png";

// Fake in loading status package
const inLoadingDnp = "is-loading.dnp.dappnode.eth";
const inLoadingAvatar = "https://i.ibb.co/RSjySdv/1ug4oj.jpg";

// Fake in updated state package
const isUpdatedDnp = "is-updated.dnp.dappnode.eth";
const isUpdatedAvatar = "https://i.ibb.co/W2mtHcS/thisisfine-1.jpg";

const sampleRequestState: RequestedDnp = {
  name: "demo-name",
  semVersion: "0.0.0",
  reqVersion: "0.0.0",
  avatarUrl: "",
  metadata: { name: "demo-name", version: "0.0.0", description: "demo" },
  specialPermissions: [],
  imageSize: 10000000,
  isUpdated: false,
  isInstalled: true,
  settings: {},
  setupWizard: {},

  request: {
    compatible: {
      requiresCoreUpdate: false,
      resolving: false,
      isCompatible: true,
      error: "",
      dnps: { "demo-name": { to: "0.0.0" } }
    },
    available: { isAvailable: true, message: "" }
  }
};

const sampleDirectoryState: DirectoryItem = {
  status: "ok",
  name: "demo-name",
  description: "Demo description",
  avatarUrl: "",
  isInstalled: false,
  isUpdated: false,
  whitelisted: true,
  isFeatured: false,
  categories: ["Blockchain"]
};

const samplePackageContainer: PackageContainer = {
  id: "7s51a",
  packageName: "demo-name",
  version: "0.0.0",
  isDnp: true,
  isCore: false,
  created: 12316723123,
  image: "demo-name:0.0.0",
  name: "demo-name",
  shortName: "demo-name",
  state: "running",
  running: true,
  dependencies: {},
  ports: [],
  volumes: [],
  defaultEnvironment: {},
  defaultPorts: [],
  defaultVolumes: [],
  avatarUrl: ""
};

export const dnpRequests: { [dnpName: string]: RequestedDnp } = {
  [lightningNetworkMetadata.name]: {
    ...sampleRequestState,
    name: lightningNetworkMetadata.name,
    reqVersion: lightningNetworkMetadata.version,
    semVersion: lightningNetworkMetadata.version,
    avatarUrl: lightningNetworkAvatar,
    metadata: lightningNetworkMetadata,

    imageSize: 19872630,
    isUpdated: false,
    isInstalled: false,

    settings: {
      [lightningNetworkMetadata.name]: lightningNetworkSetup,
      [bitcoinMetadata.name]: bitcoinUserSettings
    },
    setupWizard: {
      [lightningNetworkMetadata.name]: lightningNetworkSetupWizard,
      [bitcoinMetadata.name]: bitcoinSetupWizard
    },

    request: {
      compatible: {
        requiresCoreUpdate: false,
        resolving: false,
        isCompatible: true,
        error: "",
        dnps: {
          [lightningNetworkMetadata.name]: { to: "0.2.2" },
          [bitcoinMetadata.name]: { from: "0.2.5", to: "0.2.5" }
        }
      },
      available: {
        isAvailable: true,
        message: ""
      }
    }
  },

  [bitcoinMetadata.name]: {
    ...sampleRequestState,
    name: bitcoinMetadata.name,
    reqVersion: bitcoinMetadata.version,
    semVersion: bitcoinMetadata.version,
    avatarUrl: bitcoinAvatar,
    metadata: bitcoinMetadata,

    imageSize: 37273582,
    isUpdated: false,
    isInstalled: true,

    settings: {
      [bitcoinMetadata.name]: bitcoinUserSettings
    },
    setupWizard: {
      [bitcoinMetadata.name]: bitcoinSetupWizard
    },

    request: {
      compatible: {
        requiresCoreUpdate: false,
        resolving: false,
        isCompatible: true,
        error: "",
        dnps: {
          [bitcoinMetadata.name]: { from: "0.2.10", to: "0.2.5" },
          "dependency.dnp.dappnode.eth": { from: "0.0.0", to: "1.2.0" }
        }
      },
      available: {
        isAvailable: true,
        message: ""
      }
    }
  },

  [trustlinesMetadata.name]: {
    ...sampleRequestState,
    name: trustlinesMetadata.name,
    reqVersion: trustlinesMetadata.version,
    semVersion: trustlinesMetadata.version,
    avatarUrl: trustlinesAvatar,
    metadata: trustlinesMetadata,
    specialPermissions: trustlinesSpecialPermissions,

    settings: {
      [trustlinesMetadata.name]: trustlinesSetup
    },
    setupWizard: {
      [trustlinesMetadata.name]: trustlinesSetupWizard
    }
  },

  [raidenMetadata.name]: {
    ...sampleRequestState,
    name: raidenMetadata.name,
    reqVersion: raidenMetadata.version,
    semVersion: raidenMetadata.version,
    avatarUrl: raidenAvatar,
    metadata: raidenMetadata,

    settings: {
      [raidenMetadata.name]: raidenSetup
    },
    setupWizard: {
      [raidenMetadata.name]: raidenSetupWizard
    }
  },

  [raidenTestnetMetadata.name]: {
    ...sampleRequestState,
    name: raidenTestnetMetadata.name,
    reqVersion: raidenTestnetMetadata.version,
    semVersion: raidenTestnetMetadata.version,
    avatarUrl: raidenTestnetAvatar,
    metadata: raidenTestnetMetadata,

    settings: {
      [raidenTestnetMetadata.name]: raidenTestnetSetup
    }
  },

  [isInstallingDnp]: {
    ...sampleRequestState,
    name: isInstallingDnp,
    reqVersion: "0.1.0",
    semVersion: "0.1.0",
    avatarUrl: isInstallingAvatar,
    metadata: isInstallingMetadata
  }
};

export const mountpoints = [
  {
    mountpoint: "",
    use: "87%",
    used: 43e9,
    total: 0,
    free: 121e9,
    vendor: "Host",
    model: "(default)"
  },
  {
    mountpoint: "/data",
    use: "68%",
    used: 380e9,
    total: 500e9,
    free: 141e9,
    vendor: "ATA",
    model: "CT500MX500SSD4"
  },
  {
    mountpoint: "/media/usb0",
    use: "1%",
    used: 992e9,
    total: 1000e9,
    free: 6.2e9,
    vendor: "SanDisk",
    model: "Ultra_USB_3.0"
  },
  {
    mountpoint: "/media/usb1",
    use: "100%",
    used: 4e9,
    total: 16e9,
    free: 7.1e9,
    vendor: "SanDisk",
    model: "Ultra_USB_3.0"
  }
];

export const hostStats = {
  cpu: "34%",
  disk: "96%",
  memory: "45%"
};

export const devices = {
  ids: ["test-name", "other-user"],
  entities: {
    "test-name": { id: "test-name", admin: true, ip: "172.10.0.1" },
    "other-user": { id: "other-user", admin: false, ip: "172.10.0.2" }
  }
};

/**
 * Actual mockState
 * ================
 */

export const directory: DirectoryItem[] = [
  {
    ...sampleDirectoryState,
    name: "bitcoin.dnp.dappnode.eth",
    description: getDescription(bitcoinMetadata),
    avatarUrl: "https://en.bitcoin.it/w/images/en/2/29/BC_Logo_.png"
  },
  {
    ...sampleDirectoryState,
    name: "lightning-network.dnp.dappnode.eth",
    description: getDescription(lightningNetworkMetadata),
    avatarUrl: lightningNetworkAvatar,
    categories: ["Payment channels", "Economic incentive"]
  },
  {
    ...sampleDirectoryState,
    name: "raiden.dnp.dappnode.eth",
    description: getDescription(raidenMetadata),
    avatarUrl: raidenAvatar,
    isFeatured: true,
    featuredStyle: {
      featuredBackground: "linear-gradient(67deg, #000000, #2f3c3e)",
      featuredColor: "white",
      featuredAvatarFilter: "invert(1)"
    },
    categories: ["Payment channels"]
  },
  {
    ...sampleDirectoryState,
    name: "raiden-testnet.dnp.dappnode.eth",
    description: getDescription(raidenTestnetMetadata),
    avatarUrl: raidenTestnetAvatar,
    isInstalled: true,
    categories: ["Developer tools"]
  },
  {
    ...sampleDirectoryState,
    name: "trustlines.dnp.dappnode.eth",
    description: getDescription(trustlinesMetadata),
    avatarUrl: trustlinesAvatar,
    isFeatured: true,
    featuredStyle: {
      featuredBackground: "linear-gradient(67deg, #140a0a, #512424)",
      featuredColor: "white"
    },
    categories: ["Blockchain"]
  },
  {
    ...sampleDirectoryState,
    name: isUpdatedDnp,
    description: "Sample package in udpated state",
    isInstalled: true,
    isUpdated: true,
    avatarUrl: isUpdatedAvatar
  },
  {
    ...sampleDirectoryState,
    name: isInstallingDnp,
    description: getDescription(isInstallingMetadata),
    avatarUrl: isInstallingAvatar
  },
  {
    ...sampleDirectoryState,
    name: inErrorDnp,
    description: "Sample package in error state",
    avatarUrl: inErrorAvatar
  },
  {
    ...sampleDirectoryState,
    name: inLoadingDnp,
    description: "Sample package in loading state",
    avatarUrl: inLoadingAvatar
  },
  {
    status: "loading",
    name: "fetch-loads.dnp.dappnode.eth",
    whitelisted: true,
    isFeatured: false,
    message:
      "Loading manifest and more stuff really long text that goes on and on and more stuff 57%"
  },
  {
    status: "error",
    name: "fetch-fails.dnp.dappnode.eth",
    whitelisted: true,
    isFeatured: false,
    message: "Can't download manifest"
  }
];

export const chainData: ChainData[] = [
  {
    dnpName: "geth.dnp.dappnode.eth",
    syncing: true,
    error: false,
    message: [
      "Blocks synced: 543000 / 654000",
      "States pulled: 25314123 / 154762142"
    ].join("\n\n"),
    help: "http://geth.io"
  },
  {
    dnpName: "rinkeby.dnp.dappnode.eth",
    syncing: true,
    error: false,
    message: "Blocks synced: 543000 / 654000",
    progress: 0.83027522935
  }
];

export const dnpInstalled: PackageContainer[] = [
  {
    ...samplePackageContainer,
    name: "admin.dnp.dappnode.eth",
    isCore: true,
    state: "exited"
  },
  {
    ...samplePackageContainer,
    name: coreName,
    isCore: true,
    version: "0.2.3",
    state: "exited"
  },
  {
    ...samplePackageContainer,
    name: lightningNetworkMetadata.name,
    origin: "/ipfs/QmcQPSzajUUKP1j4rsnGRCcAqfnuGSFnCcC4fnmf6eUqcy",
    isDnp: true,
    version: "0.1.0",
    state: "running",
    ports: [
      {
        host: 30303,
        container: 30303,
        protocol: "TCP"
      },
      {
        host: 30303,
        container: 30303,
        protocol: "UDP"
      }
    ],
    volumes: [],
    manifest: lightningNetworkMetadata,
    envs: {
      ENV_NAME: "ENV_VALUE"
    },
    gettingStarted: lightningNetworkGettingStarted,
    gettingStartedShow: true
  },
  {
    ...samplePackageContainer,
    name: "wifi.dnp.dappnode.eth",
    isCore: true,
    envs: {
      SSID: "DAppNodeWIFI",
      WPA_PASSPHRASE: "dappnode"
    }
  },
  {
    ...samplePackageContainer,
    name: "openethereum.dnp.dappnode.eth",
    isCore: false,
    version: "0.2.6",
    state: "running",
    ports: [
      {
        host: 30303,
        container: 30303,
        protocol: "TCP"
      },
      {
        host: 30303,
        container: 30303,
        protocol: "UDP"
      }
    ],
    volumes: [
      {
        host: "/var/lib/docker/volumes/paritydnpdappnodeeth_data/_data",
        container: "/app/.parity",
        name: "paritydnpdappnodeeth_data",
        users: ["parity.dnp.dappnode.eth"],
        owner: "parity.dnp.dappnode.eth",
        isOwner: true,
        size: 71570000000
      },
      {
        host: "/var/lib/docker/volumes/paritydnpdappnodeeth_geth/_data",
        container: "/root/.ethereum/",
        name: "paritydnpdappnodeeth_geth",
        users: ["parity.dnp.dappnode.eth"],
        owner: "parity.dnp.dappnode.eth",
        isOwner: true,
        size: 94620000000
      }
    ],
    envs: {},
    avatarUrl: "https://pbs.twimg.com/media/DOnE7skW4AQ-FBd.png",
    canBeFullnode: true,
    manifest: openEthereumMetadata
  },
  {
    ...samplePackageContainer,
    name: raidenMetadata.name,
    isCore: false,
    avatarUrl: raidenAvatar
  }
];

export const packagesDetailData: { [id: string]: PackageDetailData } = {
  [raidenMetadata.name]: {
    setupWizard: raidenSetupWizard,
    userSettings: raidenTestnetSetup
  }
};

/**
 * ==========
 * dnpRequest
 * ==========
 */

export const mockState = {
  isInstallingLogs: {
    /* Core update */
    logs: {
      [coreName]: {
        [coreName]: "Downloading 54%",
        "vpn.dnp.dappnode.eth": "Downloading 79%",
        "admin.dnp.dappnode.eth": "Loading..."
      },

      /* Regular install of non-core*/
      [isInstallingDnp]: {
        [isInstallingDnp]: "Downloading 47%"
      }
    },
    dnpNameToLogId: {
      [isInstallingDnp]: isInstallingDnp,
      [coreName]: coreName
    }
  }
};
