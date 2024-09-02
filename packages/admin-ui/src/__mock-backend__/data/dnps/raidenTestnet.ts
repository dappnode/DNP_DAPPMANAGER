import { MockDnp } from "./types";

const dnpName = "raiden-testnet.dnp.dappnode.eth";
const serviceName = dnpName;

export const raidenTestnet: MockDnp = {
  avatar: "https://i.ibb.co/2ynnctD/raiden-testnet-300.png",

  manifest: {
    name: dnpName,
    version: "0.0.2",
    description:
      "The Raiden Network is an off-chain scaling solution, enabling near-instant, low-fee and scalable payments. It’s complementary to the Ethereum blockchain and works with any ERC20 compatible token. \n\n\n **Getting started** \n\n Once you have installed the Raiden DAppNode Package you **must** upload your own keystore. Go to this [getting started guide](https://github.com/dappnode/DAppNodePackage-raiden) to learn how to do so.  \n\n\n All set? Check out the [documentation and introductory guides](https://raiden-network.readthedocs.io/en/stable/#how-to-get-started) to quickly get started doing payments.",
    type: "service",
    author: "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
    contributors: ["Abel Boldú (@vdo)", "Eduardo Antuña (@eduadiez)"],
    links: {
      WebApplication: "http://raiden-testnet.dappnode/",
      homepage: "https://github.com/dappnode/DAppNodePackage-raiden-testnet#readme"
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
  },

  userSettings: {
    namedVolumeMountpoints: { data: "" },
    environment: {
      [serviceName]: {
        RAIDEN_ADDRESS: "",
        RAIDEN_KEYSTORE_PASSWORD: "",
        RAIDEN_ETH_RPC_ENDPOINT: "http://goerli-geth.dappnode:8545",
        RAIDEN_NETWORK_ID: "goerli",
        EXTRA_OPTS: "--disable-debug-logfile"
      }
    }
  }
};
