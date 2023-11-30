import { MockDnp } from "./types";

const dnpName = "raiden.dnp.dappnode.eth";
const serviceName = dnpName;

export const raiden: MockDnp = {
  avatar: "https://i.ibb.co/Y0YzyrG/raiden300-min.png",

  manifest: {
    name: dnpName,
    version: "0.0.1",
    upstreamVersion: "0.100.3",
    shortDescription: "Fast, cheap, scalable token transfers for Ethereum",
    description:
      "The Raiden Network is an off-chain scaling solution, enabling near-instant, low-fee and scalable payments. It’s complementary to the Ethereum blockchain and works with any ERC20 compatible token. \n\n\n **Getting started** \n\n Once you have installed the Raiden DAppNode Package you **must** upload your own keystore. Go to this [getting started guide](https://github.com/dappnode/DAppNodePackage-raiden) to learn how to do so.  \n\n\n All set? Check out the [documentation and introductory guides](https://raiden-network.readthedocs.io/en/stable/#how-to-get-started) to quickly get started doing payments.",
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
    //@ts-ignore
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
  },

  setupWizard: {
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
  },

  userSettings: {
    namedVolumeMountpoints: { data: "" },
    environment: {
      [serviceName]: {
        RAIDEN_KEYSTORE_PASSWORD: "",
        RAIDEN_ADDRESS: "",
        EXTRA_OPTS: "--disable-debug-logfile"
      }
    }
  }
};
