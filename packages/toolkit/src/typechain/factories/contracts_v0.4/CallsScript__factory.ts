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
import type {
  CallsScript,
  CallsScriptInterface,
} from "../../contracts_v0.4/CallsScript";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "sender",
        type: "address",
      },
      {
        indexed: true,
        name: "src",
        type: "address",
      },
      {
        indexed: true,
        name: "dst",
        type: "address",
      },
    ],
    name: "LogScriptCall",
    type: "event",
  },
  {
    constant: false,
    inputs: [
      {
        name: "_script",
        type: "bytes",
      },
      {
        name: "_input",
        type: "bytes",
      },
      {
        name: "_blacklist",
        type: "address[]",
      },
    ],
    name: "execScript",
    outputs: [
      {
        name: "",
        type: "bytes",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x6060604052341561000f57600080fd5b6103938061001e6000396000f3006060604052600436106100405763ffffffff7c0100000000000000000000000000000000000000000000000000000000600035041663279cea358114610045575b600080fd5b341561005057600080fd5b61007b60246004803582810192908201359181358083019290820135916044359182019101356100f2565b60405160208082528190810183818151815260200191508051906020019080838360005b838110156100b757808201518382015260200161009f565b50505050905090810190601f1680156100e45780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6100fa610355565b600460008080805b8a8510156102a25761014c858d8d8080601f016020809104026020016040519081016040528181529291906020840183838082843750949594505063ffffffff6102b11692505050565b9350600092505b868310156101a25787878481811061016757fe5b90506020020135600160a060020a0316600160a060020a031684600160a060020a03161415151561019757600080fd5b600190920191610153565b83600160a060020a031630600160a060020a031633600160a060020a03167f9dcff9d94fbfdb4622d11edb383005f95e78efb446c72d92f8e615c6025c470360405160405180910390a4610231856014018d8d8080601f016020809104026020016040519081016040528181529291906020840183838082843750949594505063ffffffff6102e61692505050565b63ffffffff16915061027d601886018d8d806020601f82018190048102016040519081016040528181529291906020840183838082843750949594505063ffffffff61033e1692505050565b905060008083836000886113885a03f180801561004057505093810160180193610102565b50505050509695505050505050565b6000806102be8484610345565b6c010000000000000000000000006bffffffffffffffffffffffff1990911604949350505050565b6000806102f38484610345565b7c01000000000000000000000000000000000000000000000000000000007fffffffff0000000000000000000000000000000000000000000000000000000090911604949350505050565b0160200190565b6000816020018301519392505050565b602060405190810160405260008152905600a165627a7a7230582058dbe8b5159e68961a717df80eabcc9ae263ab0a4cb5677af5327a57f6d4282e0029";

type CallsScriptConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: CallsScriptConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class CallsScript__factory extends ContractFactory {
  constructor(...args: CallsScriptConstructorParams) {
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
      CallsScript & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): CallsScript__factory {
    return super.connect(runner) as CallsScript__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): CallsScriptInterface {
    return new Interface(_abi) as CallsScriptInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): CallsScript {
    return new Contract(address, _abi, runner) as unknown as CallsScript;
  }
}
