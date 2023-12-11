/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { ethers } from "ethers";
import type { ContractTransactionResponse } from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../common.js";
import type {
  EVMScriptRunner,
  EVMScriptRunnerInterface,
} from "../../contracts_v0.4/EVMScriptRunner.js";

const _abi = [
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
    name: "appId",
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
    name: "kernel",
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
    inputs: [
      {
        name: "_script",
        type: "bytes",
      },
    ],
    name: "getExecutor",
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
] as const;

const _bytecode =
  "0x6060604052341561000f57600080fd5b6103f08061001e6000396000f3006060604052600436106100535763ffffffff60e060020a60003504166360b1e057811461005857806380afdea81461007d5780639b3fdf4c14610090578063d4aae0c4146100a3578063f92a79ff146100df575b600080fd5b341561006357600080fd5b61006b610130565b60405190815260200160405180910390f35b341561008857600080fd5b61006b610164565b341561009b57600080fd5b61006b61016a565b34156100ae57600080fd5b6100b66101e6565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b34156100ea57600080fd5b6100b660046024813581810190830135806020601f8201819004810201604051908101604052818152929190602084018383808284375094965061020295505050505050565b6040517f65766d7265672e617261676f6e706d2e657468000000000000000000000000008152601301604051809103902081565b60015481565b6040517f6170700000000000000000000000000000000000000000000000000000000000815260030160405180910390206040517f65766d7265672e617261676f6e706d2e6574680000000000000000000000000081526013016040518091039020604051918252602082015260409081019051809103902081565b60005473ffffffffffffffffffffffffffffffffffffffff1681565b600061020c6102eb565b73ffffffffffffffffffffffffffffffffffffffff166304bf2a7f836000604051602001526040518263ffffffff1660e060020a0281526004018080602001828103825283818151815260200191508051906020019080838360005b83811015610280578082015183820152602001610268565b50505050905090810190601f1680156102ad5780820380516001836020036101000a031916815260200191505b5092505050602060405180830381600087803b15156102cb57600080fd5b6102c65a03f115156102dc57600080fd5b50505060405180519392505050565b60008054819073ffffffffffffffffffffffffffffffffffffffff166342c71f1d6040517f6170700000000000000000000000000000000000000000000000000000000000815260030160405180910390206040517f65766d7265672e617261676f6e706d2e6574680000000000000000000000000081526013016040518091039020604051918252602082015260409081019051809103902060006040516020015260405160e060020a63ffffffff84160281526004810191909152602401602060405180830381600087803b15156102cb57600080fd00a165627a7a72305820b7c2faf619cf34902ee69c91d4c91443db1911aa6cf5b777de94c31372f481040029";

type EVMScriptRunnerConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ethers.ContractFactory>;

const isSuperArgs = (
  xs: EVMScriptRunnerConstructorParams
): xs is ConstructorParameters<typeof ethers.ContractFactory> => xs.length > 1;

export class EVMScriptRunner__factory extends ethers.ContractFactory {
  constructor(...args: EVMScriptRunnerConstructorParams) {
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
      EVMScriptRunner & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): EVMScriptRunner__factory {
    return super.connect(runner) as EVMScriptRunner__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): EVMScriptRunnerInterface {
    return new ethers.Interface(_abi) as EVMScriptRunnerInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): EVMScriptRunner {
    return new ethers.Contract(
      address,
      _abi,
      runner
    ) as unknown as EVMScriptRunner;
  }
}
