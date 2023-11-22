/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../common";
import type { Owned, OwnedInterface } from "../../contracts_v0.5/Owned";

const _abi = [
  {
    inputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [],
    name: "OwnershipRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "by",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
    ],
    name: "OwnershipRequested",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    constant: true,
    inputs: [],
    name: "newOwnerCandidate",
    outputs: [
      {
        internalType: "address",
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
    name: "owner",
    outputs: [
      {
        internalType: "address",
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
        internalType: "address",
        name: "_newOwnerCandidate",
        type: "address",
      },
    ],
    name: "proposeOwnership",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [],
    name: "acceptOwnership",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        internalType: "address",
        name: "_newOwner",
        type: "address",
      },
    ],
    name: "changeOwnership",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        internalType: "address",
        name: "_dac",
        type: "address",
      },
    ],
    name: "removeOwnership",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b50600080546001600160a01b0319163317905561033e806100326000396000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c80632af4c31e14610067578063666a34271461008f578063710bf322146100b557806379ba5097146100db5780638da5cb5b146100e3578063d091b55014610107575b600080fd5b61008d6004803603602081101561007d57600080fd5b50356001600160a01b031661010f565b005b61008d600480360360208110156100a557600080fd5b50356001600160a01b0316610198565b61008d600480360360208110156100cb57600080fd5b50356001600160a01b031661020e565b61008d610277565b6100eb6102eb565b604080516001600160a01b039092168252519081900360200190f35b6100eb6102fa565b6000546001600160a01b0316331461012657600080fd5b6001600160a01b03811661013957600080fd5b600080546001600160a01b038381166001600160a01b031980841691909117808555600180549092169091556040519282169391169183917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e091a35050565b6000546001600160a01b031633146101af57600080fd5b6001600160a01b03811661036b60961b146101c957600080fd5b600080546001600160a01b031990811682556001805490911690556040517f94e8b32e01b9eedfddd778ffbd051a7718cdc14781702884561162dca6f74dbb9190a150565b6000546001600160a01b0316331461022557600080fd5b600180546001600160a01b0319166001600160a01b03838116919091179182905560405191169033907f13a4b3bc0d5234dd3d87c9f1557d8faefa37986da62c36ba49309e2fb2c9aec490600090a350565b6001546001600160a01b0316331461028e57600080fd5b60008054600180546001600160a01b038082166001600160a01b03198086169190911780875592169092556040519282169391169183917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e091a350565b6000546001600160a01b031681565b6001546001600160a01b03168156fea265627a7a72315820f171845911b6cd97893cf0268fe0fc2c7975d66a5d136fedb1923d16363bc6f764736f6c63430005110032";

type OwnedConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: OwnedConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Owned__factory extends ContractFactory {
  constructor(...args: OwnedConstructorParams) {
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
      Owned & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): Owned__factory {
    return super.connect(runner) as Owned__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): OwnedInterface {
    return new Interface(_abi) as OwnedInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): Owned {
    return new Contract(address, _abi, runner) as unknown as Owned;
  }
}
