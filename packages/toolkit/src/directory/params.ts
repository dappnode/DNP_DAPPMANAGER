export const fromBlock = 5254499;
export const directoryContractName = "directory";
export const directoryAddress = "0xf19F629642C6697Af77d8316BeF8DE0de3A27a70";
export const directoryAbi = [
  {
    constant: false,
    inputs: [
      { name: "name", type: "string" },
      { name: "status", type: "uint128" },
      { name: "position", type: "uint128" }
    ],
    name: "addPackage",
    outputs: [{ name: "idPackage", type: "uint256" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "escapeHatchCaller",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [{ name: "_newOwner", type: "address" }],
    name: "changeOwnership",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "featured",
    outputs: [{ name: "", type: "bytes32" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "idPackage", type: "uint256" },
      { name: "newStatus", type: "uint128" }
    ],
    name: "changeStatus",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [{ name: "_dac", type: "address" }],
    name: "removeOwnership",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "idPackage1", type: "uint256" },
      { name: "idPackage2", type: "uint256" }
    ],
    name: "switchPosition",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [{ name: "_newOwnerCandidate", type: "address" }],
    name: "proposeOwnership",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "idPackage", type: "uint256" },
      { name: "newPosition", type: "uint128" }
    ],
    name: "changePosition",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [],
    name: "acceptOwnership",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [{ name: "_token", type: "address" }],
    name: "isTokenEscapable",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [{ name: "_token", type: "address" }],
    name: "escapeHatch",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "numberOfDAppNodePackages",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [{ name: "idPackage", type: "uint256" }],
    name: "getPackage",
    outputs: [
      { name: "name", type: "string" },
      { name: "status", type: "uint128" },
      { name: "position", type: "uint128" }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "idPackage", type: "uint256" },
      { name: "name", type: "string" },
      { name: "status", type: "uint128" },
      { name: "position", type: "uint128" }
    ],
    name: "updatePackage",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "newOwnerCandidate",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [{ name: "_newEscapeHatchCaller", type: "address" }],
    name: "changeHatchEscapeCaller",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [{ name: "_featured", type: "bytes32" }],
    name: "changeFeatured",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "escapeHatchDestination",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "_escapeHatchCaller", type: "address" },
      { name: "_escapeHatchDestination", type: "address" }
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "idPackage", type: "uint256" },
      { indexed: false, name: "name", type: "string" }
    ],
    name: "PackageAdded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "idPackage", type: "uint256" },
      { indexed: false, name: "name", type: "string" }
    ],
    name: "PackageUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "idPackage", type: "uint256" },
      { indexed: false, name: "newStatus", type: "uint128" }
    ],
    name: "StatusChanged",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "idPackage", type: "uint256" },
      { indexed: false, name: "newPosition", type: "uint128" }
    ],
    name: "PositionChanged",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "newFeatured", type: "bytes32" }],
    name: "FeaturedChanged",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "token", type: "address" }],
    name: "EscapeHatchBlackistedToken",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "token", type: "address" },
      { indexed: false, name: "amount", type: "uint256" }
    ],
    name: "EscapeHatchCalled",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "by", type: "address" },
      { indexed: true, name: "to", type: "address" }
    ],
    name: "OwnershipRequested",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" }
    ],
    name: "OwnershipTransferred",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [],
    name: "OwnershipRemoved",
    type: "event"
  }
] as const;
