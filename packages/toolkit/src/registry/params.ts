import { Abi } from "../types.js";

export const dnpRegistryGraphEndpoint =
  "https://api.studio.thegraph.com/query/45661/dappnode-registry/v0.0.3";
export const publicRegistryGraphEndpoint =
  "https://api.studio.thegraph.com/query/45661/public-registry/v0.1.0";

// APM REGISTRY SMART CONTRACT: https://etherscan.io/address/0x1d9bdf492e59a306dda59e5aa13e7f1c7d89197a#code

// This SC allows to create ENS for dappnode like public.dappnode.eth and dnp.public.eth

// are generated from the same SC: APM Registry
// To get into this SC is necessary to do in Etherscan:
//     1. Verify proxy
//     2. Read as proxy
//     3. Go to the source SC
// This is because the SC is "upgradable".

export const registryContractName = "registry";
export const registryAddress = "0x1d9Bdf492e59A306DDa59E5aA13E7F1C7D89197A";
// public.dappnode.eth: 0x9f85ae5aefe4a3eff39d9a44212aae21dd15079aç
export const registryPublicAddress =
  "0x9f85ae5aefe4a3eff39d9a44212aae21dd15079a";
// dnp.dappnode.eth: 0x266bfdb2124a68beb6769dc887bd655f78778923
export const registryDnpAddress = "0x266bfdb2124a68beb6769dc887bd655f78778923";
export const registryAbi: Abi = [
  {
    constant: true,
    inputs: [],
    name: "REPO_APP_NAME",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "APM_APP_NAME",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "ENS_SUB_APP_NAME",
    outputs: [{ name: "", type: "string" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "registrar",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_name", type: "string" },
      { name: "_dev", type: "address" },
      { name: "_initialSemanticVersion", type: "uint16[3]" },
      { name: "_contractAddress", type: "address" },
      { name: "_contentURI", type: "bytes" },
    ],
    name: "newRepoWithVersion",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "CREATE_REPO_ROLE",
    outputs: [{ name: "", type: "bytes32" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "EVMSCRIPT_REGISTRY_APP_ID",
    outputs: [{ name: "", type: "bytes32" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "appId",
    outputs: [{ name: "", type: "bytes32" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "getInitializationBlock",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "EVMSCRIPT_REGISTRY_APP",
    outputs: [{ name: "", type: "bytes32" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_sender", type: "address" },
      { name: "_role", type: "bytes32" },
      { name: "params", type: "uint256[]" },
    ],
    name: "canPerform",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_name", type: "string" },
      { name: "_dev", type: "address" },
    ],
    name: "newRepo",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ name: "_registrar", type: "address" }],
    name: "initialize",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "kernel",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_script", type: "bytes" }],
    name: "getExecutor",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "id", type: "bytes32" },
      { indexed: false, name: "name", type: "string" },
      { indexed: false, name: "repo", type: "address" },
    ],
    name: "NewRepo",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "proxy", type: "address" }],
    name: "NewAppProxy",
    type: "event",
  },
];
