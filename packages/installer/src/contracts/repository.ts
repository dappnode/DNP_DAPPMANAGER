// REPOSITORY SMART CONTRACT: https://etherscan.io/address/0x95b9067d07d6c96a63a3119285b0aa6092e32a4b#code

// This SC creates repos for DAppNodePackages to control versioning

export const contractName = "repository";
// Address is dynamic because it will deppend of the ENS, example: poligon.public.dappnode.eth
// 0xec2A48F81A79aD576160f14A541afF5fC4c997AF https://etherscan.io/address/0xec2a48f81a79ad576160f14a541aff5fc4c997af
// The source ABI Implementation is: https://etherscan.io/address/0x95b9067d07d6c96a63a3119285b0aa6092e32a4b#code
export const address = "0x95B9067D07d6C96a63A3119285B0aa6092E32a4b";
export const abi = [
  {
    constant: true,
    inputs: [{ name: "_semanticVersion", type: "uint16[3]" }],
    name: "getBySemanticVersion",
    outputs: [
      { name: "semanticVersion", type: "uint16[3]" },
      { name: "contractAddress", type: "address" },
      { name: "contentURI", type: "bytes" }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "EVMSCRIPT_REGISTRY_APP_ID",
    outputs: [{ name: "", type: "bytes32" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "_newSemanticVersion", type: "uint16[3]" },
      { name: "_contractAddress", type: "address" },
      { name: "_contentURI", type: "bytes" }
    ],
    name: "newVersion",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [{ name: "_versionId", type: "uint256" }],
    name: "getByVersionId",
    outputs: [
      { name: "semanticVersion", type: "uint16[3]" },
      { name: "contractAddress", type: "address" },
      { name: "contentURI", type: "bytes" }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "appId",
    outputs: [{ name: "", type: "bytes32" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "getInitializationBlock",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [{ name: "_contractAddress", type: "address" }],
    name: "getLatestForContractAddress",
    outputs: [
      { name: "semanticVersion", type: "uint16[3]" },
      { name: "contractAddress", type: "address" },
      { name: "contentURI", type: "bytes" }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "EVMSCRIPT_REGISTRY_APP",
    outputs: [{ name: "", type: "bytes32" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      { name: "_sender", type: "address" },
      { name: "_role", type: "bytes32" },
      { name: "params", type: "uint256[]" }
    ],
    name: "canPerform",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      { name: "_oldVersion", type: "uint16[3]" },
      { name: "_newVersion", type: "uint16[3]" }
    ],
    name: "isValidBump",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "pure",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "CREATE_VERSION_ROLE",
    outputs: [{ name: "", type: "bytes32" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "getLatest",
    outputs: [
      { name: "semanticVersion", type: "uint16[3]" },
      { name: "contractAddress", type: "address" },
      { name: "contentURI", type: "bytes" }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "getVersionsCount",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "kernel",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [{ name: "_script", type: "bytes" }],
    name: "getExecutor",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "versionId", type: "uint256" },
      { indexed: false, name: "semanticVersion", type: "uint16[3]" }
    ],
    name: "NewVersion",
    type: "event"
  }
];
