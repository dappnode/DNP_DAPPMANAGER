/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { ethers } from "ethers";
import type { ContractTransactionResponse } from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../common.js";
import type {
  EVMScriptRegistryFactory,
  EVMScriptRegistryFactoryInterface,
} from "../../contracts_v0.4/EVMScriptRegistryFactory.js";

const _abi = [
  {
    constant: true,
    inputs: [],
    name: "baseReg",
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "baseDeployDel",
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "EVMSCRIPT_REGISTRY_APP_ID",
    outputs: [
      {
        name: "",
        type: "bytes32",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "EVMSCRIPT_REGISTRY_APP",
    outputs: [
      {
        name: "",
        type: "bytes32",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "baseCalls",
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_kernel",
        type: "address",
      },
      {
        name: "_appId",
        type: "bytes32",
      },
      {
        name: "_initializePayload",
        type: "bytes",
      },
    ],
    name: "newAppProxyPinned",
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_kernel",
        type: "address",
      },
      {
        name: "_appId",
        type: "bytes32",
      },
    ],
    name: "newAppProxy",
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "baseDel",
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_kernel",
        type: "address",
      },
      {
        name: "_appId",
        type: "bytes32",
      },
      {
        name: "_initializePayload",
        type: "bytes",
      },
    ],
    name: "newAppProxy",
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_kernel",
        type: "address",
      },
      {
        name: "_appId",
        type: "bytes32",
      },
    ],
    name: "newAppProxyPinned",
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: "proxy",
        type: "address",
      },
    ],
    name: "NewAppProxy",
    type: "event",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_dao",
        type: "address",
      },
      {
        name: "_root",
        type: "address",
      },
    ],
    name: "newEVMScriptRegistry",
    outputs: [
      {
        name: "reg",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x6060604052341561000f57600080fd5b61001761010c565b604051809103906000f080151561002d57600080fd5b60008054600160a060020a031916600160a060020a039290921691909117905561005561011d565b604051809103906000f080151561006b57600080fd5b60018054600160a060020a031916600160a060020a039290921691909117905561009361012e565b604051809103906000f08015156100a957600080fd5b60028054600160a060020a031916600160a060020a03929092169190911790556100d161013f565b604051809103906000f08015156100e757600080fd5b60038054600160a060020a031916600160a060020a0392909216919091179055610150565b604051610aac8062001cb983390190565b6040516103b1806200276583390190565b6040516104b08062002b1683390190565b60405161050d8062002fc683390190565b611b5980620001606000396000f3006060604052600436106100955763ffffffff60e060020a600035041663127d679c811461009a5780631b380940146100c957806360b1e057146100dc578063869abc24146101015780639b3fdf4c14610126578063af9a21bc14610139578063d162f8b01461014c578063e156a8f3146101b1578063e602e712146101d3578063ede658b0146101e6578063ff289fc51461024b575b600080fd5b34156100a557600080fd5b6100ad61026d565b604051600160a060020a03909116815260200160405180910390f35b34156100d457600080fd5b6100ad61027c565b34156100e757600080fd5b6100ef61028b565b60405190815260200160405180910390f35b341561010c57600080fd5b6100ad600160a060020a03600435811690602435166102ad565b341561013157600080fd5b6100ef6108f6565b341561014457600080fd5b6100ad610960565b341561015757600080fd5b6100ad60048035600160a060020a03169060248035919060649060443590810190830135806020601f8201819004810201604051908101604052818152929190602084018383808284375094965061096f95505050505050565b34156101bc57600080fd5b6100ad600160a060020a0360043516602435610a5d565b34156101de57600080fd5b6100ad610a94565b34156101f157600080fd5b6100ad60048035600160a060020a03169060248035919060649060443590810190830135806020601f82018190048102016040519081016040528181529291906020840183838082843750949650610aa395505050505050565b341561025657600080fd5b6100ad600160a060020a0360043516602435610ab1565b600054600160a060020a031681565b600354600160a060020a031681565b604051600080516020611b0e8339815191528152601301604051809103902081565b60008083600160a060020a031663958fde82604051600080516020611b0e833981519152815260130160405190819003902060008054600160a060020a0316906040516020015260405160e060020a63ffffffff85160281526004810192909252600160a060020a03166024820152604401602060405180830381600087803b151561033857600080fd5b6102c65a03f1151561034957600080fd5b5050506040518051925050600160a060020a038216638129fc1c6040518163ffffffff1660e060020a028152600401600060405180830381600087803b151561039157600080fd5b6102c65a03f115156103a257600080fd5b50505083600160a060020a031663de2873596000604051602001526040518163ffffffff1660e060020a028152600401602060405180830381600087803b15156103eb57600080fd5b6102c65a03f115156103fc57600080fd5b5050506040518051915050600160a060020a03841663ae5b25408163178e60796000604051602001526040518163ffffffff1660e060020a028152600401602060405180830381600087803b151561045357600080fd5b6102c65a03f1151561046457600080fd5b50505060405180519050604051600080516020611b0e833981519152815260130160405180910390208560006040516020015260405160e060020a63ffffffff861602815260048101939093526024830191909152600160a060020a03166044820152606401602060405180830381600087803b15156104e357600080fd5b6102c65a03f115156104f457600080fd5b505050604051805190505080600160a060020a031663be038478308485600160a060020a031663bd8fde1c6000604051602001526040518163ffffffff1660e060020a028152600401602060405180830381600087803b151561055657600080fd5b6102c65a03f1151561056757600080fd5b505050604051805190503060405160e060020a63ffffffff8716028152600160a060020a039485166004820152928416602484015260448301919091529091166064820152608401600060405180830381600087803b15156105c857600080fd5b6102c65a03f115156105d957600080fd5b5050600154600160a060020a0380851692506387a16f12911660006040516020015260405160e060020a63ffffffff8416028152600160a060020a039091166004820152602401602060405180830381600087803b151561063957600080fd5b6102c65a03f1151561064a57600080fd5b50505060405180515050600254600160a060020a03808416916387a16f12911660006040516020015260405160e060020a63ffffffff8416028152600160a060020a039091166004820152602401602060405180830381600087803b15156106b157600080fd5b6102c65a03f115156106c257600080fd5b50505060405180515050600354600160a060020a03808416916387a16f12911660006040516020015260405160e060020a63ffffffff8416028152600160a060020a039091166004820152602401602060405180830381600087803b151561072957600080fd5b6102c65a03f1151561073a57600080fd5b505050604051805190505080600160a060020a0316639d0effdb308485600160a060020a031663bd8fde1c6000604051602001526040518163ffffffff1660e060020a028152600401602060405180830381600087803b151561079c57600080fd5b6102c65a03f115156107ad57600080fd5b5050506040518051905060405160e060020a63ffffffff8616028152600160a060020a0393841660048201529190921660248201526044810191909152606401600060405180830381600087803b151561080657600080fd5b6102c65a03f1151561081757600080fd5b50505080600160a060020a031663afd925df848485600160a060020a031663bd8fde1c6000604051602001526040518163ffffffff1660e060020a028152600401602060405180830381600087803b151561087157600080fd5b6102c65a03f1151561088257600080fd5b5050506040518051905060405160e060020a63ffffffff8616028152600160a060020a0393841660048201529190921660248201526044810191909152606401600060405180830381600087803b15156108db57600080fd5b6102c65a03f115156108ec57600080fd5b5050505092915050565b6040517f617070000000000000000000000000000000000000000000000000000000000081526003016040518091039020604051600080516020611b0e83398151915281526013016040518091039020604051918252602082015260409081019051809103902081565b600154600160a060020a031681565b60008084848461097d610ae1565b600160a060020a03841681526020810183905260606040820181815290820183818151815260200191508051906020019080838360005b838110156109cc5780820151838201526020016109b4565b50505050905090810190601f1680156109f95780820380516001836020036101000a031916815260200191505b50945050505050604051809103906000f0801515610a1657600080fd5b90507fe28f1412cafe58e22073759128eddcccfd9c1e3326665df874bdaf26077231a981604051600160a060020a03909116815260200160405180910390a1949350505050565b6000610a8d83836000604051805910610a735750595b818152601f19601f83011681016020016040529050610aa3565b9392505050565b600254600160a060020a031681565b60008084848461097d610af1565b6000610a8d83836000604051805910610ac75750595b818152601f19601f8301168101602001604052905061096f565b6040516107fe80610b0283390190565b60405161080e806113008339019056006060604052341561000f57600080fd5b6040516107fe3803806107fe83398101604052808051919060200180519190602001805160008054600160a060020a031916600160a060020a0387161781556001859055920191849150839083906100738364010000000061017881026104901704565b9050600082511115610124576100958164010000000061048861024b82021704565b15156100a057600080fd5b80600160a060020a03168260405180828051906020019080838360005b838110156100d55780820151838201526020016100bd565b50505050905090810190601f1680156101025780820380516001836020036101000a031916815260200191505b509150506000604051808303818561646e5a03f4915050151561012457600080fd5b5050505061014660015461017864010000000002610490176401000000009004565b60028054600160a060020a031916600160a060020a03928316179081905516151561017057600080fd5b505050610253565b60008054600160a060020a03166342c71f1d6040517f6261736500000000000000000000000000000000000000000000000000000000815260040160405180910390208460405191825260208201526040908101905180910390206000604051602001526040517c010000000000000000000000000000000000000000000000000000000063ffffffff84160281526004810191909152602401602060405180830381600087803b151561022b57600080fd5b6102c65a03f1151561023c57600080fd5b50505060405180519392505050565b6000903b1190565b61059c806102626000396000f3006060604052600436106100ae5763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416631113ed0d81146100f1578063178e6079146101165780632501269914610129578063756f60491461013c57806380afdea81461014f578063a3b4b07f14610162578063cbcc65eb14610175578063d4aae0c414610188578063daa3a163146101c4578063db8a61d4146101eb578063ea879634146101fe575b6100ef6100b961020d565b6000368080601f016020809104026020016040519081016040528181529291906020840183838082843750610229945050505050565b005b34156100fc57600080fd5b610104610265565b60405190815260200160405180910390f35b341561012157600080fd5b610104610299565b341561013457600080fd5b6101046102cd565b341561014757600080fd5b610104610349565b341561015a57600080fd5b61010461037d565b341561016d57600080fd5b610104610383565b341561018057600080fd5b6101046103ff565b341561019357600080fd5b61019b610433565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b34156101cf57600080fd5b6101d761044f565b604051901515815260200160405180910390f35b34156101f657600080fd5b610104610454565b341561020957600080fd5b61019b5b60025473ffffffffffffffffffffffffffffffffffffffff1690565b61023282610488565b151561023d57600080fd5b600080825160208401856127105a03f43d604051816000823e828015610261578282f35b8282fd5b6040517f6b65726e656c2e617261676f6e706d2e657468000000000000000000000000008152601301604051809103902081565b6040517f61707000000000000000000000000000000000000000000000000000000000008152600301604051809103902081565b6040517f636f726500000000000000000000000000000000000000000000000000000000815260040160405180910390206040517f6b65726e656c2e617261676f6e706d2e6574680000000000000000000000000081526013016040518091039020604051918252602082015260409081019051809103902081565b6040517f636f7265000000000000000000000000000000000000000000000000000000008152600401604051809103902081565b60015481565b6040517f6170700000000000000000000000000000000000000000000000000000000000815260030160405180910390206040517f61636c2e617261676f6e706d2e6574680000000000000000000000000000000081526010016040518091039020604051918252602082015260409081019051809103902081565b6040517f61636c2e617261676f6e706d2e657468000000000000000000000000000000008152601001604051809103902081565b60005473ffffffffffffffffffffffffffffffffffffffff1681565b600090565b6040517f62617365000000000000000000000000000000000000000000000000000000008152600401604051809103902081565b6000903b1190565b6000805473ffffffffffffffffffffffffffffffffffffffff166342c71f1d6040517f6261736500000000000000000000000000000000000000000000000000000000815260040160405180910390208460405191825260208201526040908101905180910390206000604051602001526040517c010000000000000000000000000000000000000000000000000000000063ffffffff84160281526004810191909152602401602060405180830381600087803b151561055057600080fd5b6102c65a03f1151561056157600080fd5b505050604051805193925050505600a165627a7a723058200149a65a2d7b8ecd92e0bee3f44adb9bbe60db85a8bfd97d8bfa7abcdbf5c30d00296060604052341561000f57600080fd5b60405161080e38038061080e83398101604052808051919060200180519190602001805160008054600160a060020a031916600160a060020a0387161781556001859055920191849150839083906100738364010000000061013081026104e01704565b905060008251111561012457610095816401000000006105c061020382021704565b15156100a057600080fd5b80600160a060020a03168260405180828051906020019080838360005b838110156100d55780820151838201526020016100bd565b50505050905090810190601f1680156101025780820380516001836020036101000a031916815260200191505b509150506000604051808303818561646e5a03f4915050151561012457600080fd5b5050505050505061020b565b60008054600160a060020a03166342c71f1d6040517f6261736500000000000000000000000000000000000000000000000000000000815260040160405180910390208460405191825260208201526040908101905180910390206000604051602001526040517c010000000000000000000000000000000000000000000000000000000063ffffffff84160281526004810191909152602401602060405180830381600087803b15156101e357600080fd5b6102c65a03f115156101f457600080fd5b50505060405180519392505050565b6000903b1190565b6105f48061021a6000396000f3006060604052600436106100b95763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416631113ed0d8114610124578063178e607914610149578063250126991461015c5780633bc7ebac1461016f578063756f6049146101ab57806380afdea8146101be578063a3b4b07f146101d1578063cbcc65eb146101e4578063d4aae0c4146101f7578063daa3a1631461020a578063db8a61d414610231578063ea87963414610244575b60006100c3610253565b905073ffffffffffffffffffffffffffffffffffffffff811615156100e757600080fd5b610121816000368080601f016020809104026020016040519081016040528181529291906020840183838082843750610265945050505050565b50005b341561012f57600080fd5b6101376102a1565b60405190815260200160405180910390f35b341561015457600080fd5b6101376102d5565b341561016757600080fd5b610137610309565b341561017a57600080fd5b610182610385565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b34156101b657600080fd5b6101376103a1565b34156101c957600080fd5b6101376103d5565b34156101dc57600080fd5b6101376103db565b34156101ef57600080fd5b610137610457565b341561020257600080fd5b61018261048b565b341561021557600080fd5b61021d6104a7565b604051901515815260200160405180910390f35b341561023c57600080fd5b6101376104ac565b341561024f57600080fd5b6101825b60006102606001546104e0565b905090565b61026e826105c0565b151561027957600080fd5b600080825160208401856127105a03f43d604051816000823e82801561029d578282f35b8282fd5b6040517f6b65726e656c2e617261676f6e706d2e657468000000000000000000000000008152601301604051809103902081565b6040517f61707000000000000000000000000000000000000000000000000000000000008152600301604051809103902081565b6040517f636f726500000000000000000000000000000000000000000000000000000000815260040160405180910390206040517f6b65726e656c2e617261676f6e706d2e6574680000000000000000000000000081526013016040518091039020604051918252602082015260409081019051809103902081565b60645473ffffffffffffffffffffffffffffffffffffffff1681565b6040517f636f7265000000000000000000000000000000000000000000000000000000008152600401604051809103902081565b60015481565b6040517f6170700000000000000000000000000000000000000000000000000000000000815260030160405180910390206040517f61636c2e617261676f6e706d2e6574680000000000000000000000000000000081526010016040518091039020604051918252602082015260409081019051809103902081565b6040517f61636c2e617261676f6e706d2e657468000000000000000000000000000000008152601001604051809103902081565b60005473ffffffffffffffffffffffffffffffffffffffff1681565b600190565b6040517f62617365000000000000000000000000000000000000000000000000000000008152600401604051809103902081565b6000805473ffffffffffffffffffffffffffffffffffffffff166342c71f1d6040517f6261736500000000000000000000000000000000000000000000000000000000815260040160405180910390208460405191825260208201526040908101905180910390206000604051602001526040517c010000000000000000000000000000000000000000000000000000000063ffffffff84160281526004810191909152602401602060405180830381600087803b15156105a057600080fd5b6102c65a03f115156105b157600080fd5b50505060405180519392505050565b6000903b11905600a165627a7a7230582095ce25f98069aa00aa3d2f2fb8ba58ced08a30e2af0a27524c49fb8a84286390002965766d7265672e617261676f6e706d2e65746800000000000000000000000000a165627a7a72305820707d289aaeeec7be2d0fa101e46494cfc86223c5a93b5bb103d101b0f99f7f4300296060604052341561000f57600080fd5b610a8e8061001e6000396000f3006060604052600436106100ab5763ffffffff60e060020a60003504166304bf2a7f81146100b05780635ca4d4bb1461011d57806360b1e0571461013557806380afdea81461015a5780638129fc1c1461016d57806387a16f12146101805780638b3dd7491461019f5780639b3fdf4c146101b2578063a1658fad146101c5578063bd8fde1c1461023c578063d4aae0c41461024f578063f92a79ff14610262578063f97a05df146102b3575b600080fd5b34156100bb57600080fd5b61010160046024813581810190830135806020601f820181900481020160405190810160405281815292919060208401838380828437509496506102ed95505050505050565b604051600160a060020a03909116815260200160405180910390f35b341561012857600080fd5b610133600435610369565b005b341561014057600080fd5b6101486103eb565b60405190815260200160405180910390f35b341561016557600080fd5b61014861041f565b341561017857600080fd5b610133610425565b341561018b57600080fd5b610148600160a060020a03600435166104cb565b34156101aa57600080fd5b6101486105a1565b34156101bd57600080fd5b6101486105a8565b34156101d057600080fd5b61022860048035600160a060020a031690602480359190606490604435908101908301358060208082020160405190810160405280939291908181526020018383602002808284375094965061062495505050505050565b604051901515815260200160405180910390f35b341561024757600080fd5b610148610762565b341561025a57600080fd5b610101610767565b341561026d57600080fd5b61010160046024813581810190830135806020601f8201819004810201604051908101604052818152929190602084018383808284375094965061077695505050505050565b34156102be57600080fd5b6102c9600435610852565b604051600160a060020a039092168252151560208201526040908101905180910390f35b60008060006102fb84610885565b63ffffffff16915081158061031257506064548210155b156103205760009250610362565b606480548390811061032e57fe5b6000918252602090912001805490915060a060020a900460ff1661035357600061035f565b8054600160a060020a03165b92505b5050919050565b60016103953382600060405180591061037f5750595b9080825280602002602001820160405250610624565b15156103a057600080fd5b60006064838154811015156103b157fe5b6000918252602090912001805491151560a060020a0274ff0000000000000000000000000000000000000000199092169190911790555050565b6040517f65766d7265672e617261676f6e706d2e657468000000000000000000000000008152601301604051809103902081565b60015481565b6003541561043257600080fd5b61043a610898565b606480546001810161044c83826109f5565b9160005260206000209001600060408051908101604052600080825260208201529190508151815473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a03919091161781556020820151815490151560a060020a0274ff0000000000000000000000000000000000000000199091161790555050565b600060016104f733828460405180591061037f5750599080825280602002602001820160405250610624565b151561050257600080fd5b606480546001810161051483826109f5565b9160005260206000209001600060408051908101604052600160a060020a0387168152600160208201529190508151815473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a03919091161781556020820151815490151560a060020a0274ff00000000000000000000000000000000000000001990911617905550915050919050565b6003545b90565b6040517f6170700000000000000000000000000000000000000000000000000000000000815260030160405180910390206040517f65766d7265672e617261676f6e706d2e6574680000000000000000000000000081526013016040518091039020604051918252602082015260409081019051809103902081565b600061062e610a1e565b6000808451111561064757835160200290508391508082525b600054600160a060020a03161580610758575060008054600160a060020a03169063fdef91069088903090899087906040516020015260405160e060020a63ffffffff8716028152600160a060020a0380861660048301908152908516602483015260448201849052608060648301908152909160840183818151815260200191508051906020019080838360005b838110156106ee5780820151838201526020016106d6565b50505050905090810190601f16801561071b5780820380516001836020036101000a031916815260200191505b5095505050505050602060405180830381600087803b151561073c57600080fd5b6102c65a03f1151561074d57600080fd5b505050604051805190505b9695505050505050565b600181565b600054600160a060020a031681565b60006107806108b2565b600160a060020a03166304bf2a7f836000604051602001526040518263ffffffff1660e060020a0281526004018080602001828103825283818151815260200191508051906020019080838360005b838110156107e75780820151838201526020016107cf565b50505050905090810190601f1680156108145780820380516001836020036101000a031916815260200191505b5092505050602060405180830381600087803b151561083257600080fd5b6102c65a03f1151561084357600080fd5b50505060405180519392505050565b606480548290811061086057fe5b600091825260209091200154600160a060020a038116915060a060020a900460ff1682565b60006108928260006109a2565b92915050565b600354156108a557600080fd5b6108ad6109e1565b600355565b600080548190600160a060020a03166342c71f1d6040517f6170700000000000000000000000000000000000000000000000000000000000815260030160405180910390206040517f65766d7265672e617261676f6e706d2e6574680000000000000000000000000081526013016040518091039020604051918252602082015260409081019051809103902060006040516020015260405160e060020a63ffffffff84160281526004810191909152602401602060405180830381600087803b151561097e57600080fd5b6102c65a03f1151561098f57600080fd5b50505060405180519250829150505b5090565b6000806109af84846109e5565b60e060020a7fffffffff0000000000000000000000000000000000000000000000000000000090911604949350505050565b4390565b6000816020018301519392505050565b815481835581811511610a1957600083815260209020610a19918101908301610a30565b505050565b60206040519081016040526000815290565b6105a591905b8082111561099e57805474ffffffffffffffffffffffffffffffffffffffffff19168155600101610a365600a165627a7a7230582033e646b488db7fea03c1e8e5a37b895ed9d1ed0a7b4aa5f52d93427c5996202e00296060604052341561000f57600080fd5b6103938061001e6000396000f3006060604052600436106100405763ffffffff7c0100000000000000000000000000000000000000000000000000000000600035041663279cea358114610045575b600080fd5b341561005057600080fd5b61007b60246004803582810192908201359181358083019290820135916044359182019101356100f2565b60405160208082528190810183818151815260200191508051906020019080838360005b838110156100b757808201518382015260200161009f565b50505050905090810190601f1680156100e45780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6100fa610355565b600460008080805b8a8510156102a25761014c858d8d8080601f016020809104026020016040519081016040528181529291906020840183838082843750949594505063ffffffff6102b11692505050565b9350600092505b868310156101a25787878481811061016757fe5b90506020020135600160a060020a0316600160a060020a031684600160a060020a03161415151561019757600080fd5b600190920191610153565b83600160a060020a031630600160a060020a031633600160a060020a03167f9dcff9d94fbfdb4622d11edb383005f95e78efb446c72d92f8e615c6025c470360405160405180910390a4610231856014018d8d8080601f016020809104026020016040519081016040528181529291906020840183838082843750949594505063ffffffff6102e61692505050565b63ffffffff16915061027d601886018d8d806020601f82018190048102016040519081016040528181529291906020840183838082843750949594505063ffffffff61033e1692505050565b905060008083836000886113885a03f180801561004057505093810160180193610102565b50505050509695505050505050565b6000806102be8484610345565b6c010000000000000000000000006bffffffffffffffffffffffff1990911604949350505050565b6000806102f38484610345565b7c01000000000000000000000000000000000000000000000000000000007fffffffff0000000000000000000000000000000000000000000000000000000090911604949350505050565b0160200190565b6000816020018301519392505050565b602060405190810160405260008152905600a165627a7a7230582058dbe8b5159e68961a717df80eabcc9ae263ab0a4cb5677af5327a57f6d4282e00296060604052341561000f57600080fd5b6104928061001e6000396000f3006060604052600436106100405763ffffffff7c0100000000000000000000000000000000000000000000000000000000600035041663279cea358114610045575b600080fd5b341561005057600080fd5b61007b60246004803582810192908201359181358083019290820135916044359182019101356100f2565b60405160208082528190810183818151815260200191508051906020019080838360005b838110156100b757808201518382015260200161009f565b50505050905090810190601f1680156100e45780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6100fa610454565b811561010557600080fd5b6018861461011257600080fd5b61018d610158600489898080601f016020809104026020016040519081016040528181529291906020840183838082843750949594505063ffffffff6101981692505050565b86868080601f0160208091040260200160405190810160405281815292919060208401838380828437506101cd945050505050565b979650505050505050565b6000806101a584846102a0565b6c010000000000000000000000006bffffffffffffffffffffffff1990911604949350505050565b6101d5610454565b6101de836102b0565b15156101e957600080fd5b8273ffffffffffffffffffffffffffffffffffffffff166000835111610216576102116102b8565b610218565b825b60405180828051906020019080838360005b8381101561024257808201518382015260200161022a565b50505050905090810190601f16801561026f5780820380516001836020036101000a031916815260200191505b509150506000604051808303818561646e5a03f4915050151561029157600080fd5b6102996102ee565b9392505050565b6000816020018301519392505050565b6000903b1190565b6102c0610454565b6102e97fc1c0e9c400000000000000000000000000000000000000000000000000000000610314565b905090565b6102f6610454565b3d6040519150602081018201604052808252806000602084013e5090565b61031c610454565b610324610454565b60046040518059106103335750595b818152601f19601f830116810160200160405290509050828160008151811061035857fe5b906020010190600160f860020a031916908160001a9053506101007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19841602816001815181106103a157fe5b906020010190600160f860020a031916908160001a905350620100007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19841602816002815181106103eb57fe5b906020010190600160f860020a031916908160001a90535063010000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff198416028160038151811061043657fe5b906020010190600160f860020a031916908160001a90535092915050565b602060405190810160405260008152905600a165627a7a7230582067f11f99e7b332c1030bb0f3572c40afc9bc8d7763444ee9bb682ef964dc8ccb00296060604052341561000f57600080fd5b6104ef8061001e6000396000f3006060604052600436106100405763ffffffff7c0100000000000000000000000000000000000000000000000000000000600035041663279cea358114610045575b600080fd5b341561005057600080fd5b61007b60246004803582810192908201359181358083019290820135916044359182019101356100f2565b60405160208082528190810183818151815260200191508051906020019080838360005b838110156100b757808201518382015260200161009f565b50505050905090810190601f1680156100e45780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6100fa6104b1565b600080831561010857600080fd5b88886040518083838082843782019150509250505060405190819003902060008181526020819052604090205490925073ffffffffffffffffffffffffffffffffffffffff1690508015156101d35761018f89898080601f016020809104026020016040519081016040528181529291906020840183838082843750610219945050505050565b6000838152602081905260409020805473ffffffffffffffffffffffffffffffffffffffff191673ffffffffffffffffffffffffffffffffffffffff831617905590505b61020c8188888080601f01602080910402602001604051908101604052818152929190602084018383808284375061023a945050505050565b9998505050505050505050565b60006004825103602483016000f09050803b15600181146100405750919050565b6102426104b1565b61024b8361030d565b151561025657600080fd5b8273ffffffffffffffffffffffffffffffffffffffff1660008351116102835761027e610315565b610285565b825b60405180828051906020019080838360005b838110156102af578082015183820152602001610297565b50505050905090810190601f1680156102dc5780820380516001836020036101000a031916815260200191505b509150506000604051808303818561646e5a03f491505015156102fe57600080fd5b61030661034b565b9392505050565b6000903b1190565b61031d6104b1565b6103467fc1c0e9c400000000000000000000000000000000000000000000000000000000610371565b905090565b6103536104b1565b3d6040519150602081018201604052808252806000602084013e5090565b6103796104b1565b6103816104b1565b60046040518059106103905750595b818152601f19601f83011681016020016040529050905082816000815181106103b557fe5b906020010190600160f860020a031916908160001a9053506101007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19841602816001815181106103fe57fe5b906020010190600160f860020a031916908160001a905350620100007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff198416028160028151811061044857fe5b906020010190600160f860020a031916908160001a90535063010000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff198416028160038151811061049357fe5b906020010190600160f860020a031916908160001a90535092915050565b602060405190810160405260008152905600a165627a7a7230582001cb2837e541448ff159f9f8f72da7347badca9d95cbeef4d4bb91bbe0ca6ea10029";

type EVMScriptRegistryFactoryConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ethers.ContractFactory>;

const isSuperArgs = (
  xs: EVMScriptRegistryFactoryConstructorParams
): xs is ConstructorParameters<typeof ethers.ContractFactory> => xs.length > 1;

export class EVMScriptRegistryFactory__factory extends ethers.ContractFactory {
  constructor(...args: EVMScriptRegistryFactoryConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(overrides || {});
  }
  override deploy(overrides?: NonPayableOverrides & { from?: string }) {
    return super.deploy(overrides || {}) as Promise<
      EVMScriptRegistryFactory & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(
    runner: ContractRunner | null
  ): EVMScriptRegistryFactory__factory {
    return super.connect(runner) as EVMScriptRegistryFactory__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): EVMScriptRegistryFactoryInterface {
    return new ethers.Interface(_abi) as EVMScriptRegistryFactoryInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): EVMScriptRegistryFactory {
    return new ethers.Contract(
      address,
      _abi,
      runner
    ) as unknown as EVMScriptRegistryFactory;
  }
}