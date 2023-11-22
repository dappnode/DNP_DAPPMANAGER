/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Interface, type ContractRunner } from "ethers";
import type {
  IEVMScriptExecutor,
  IEVMScriptExecutorInterface,
} from "../../contracts_v0.4/IEVMScriptExecutor";

const _abi = [
  {
    constant: false,
    inputs: [
      {
        name: "script",
        type: "bytes",
      },
      {
        name: "input",
        type: "bytes",
      },
      {
        name: "blacklist",
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

export class IEVMScriptExecutor__factory {
  static readonly abi = _abi;
  static createInterface(): IEVMScriptExecutorInterface {
    return new Interface(_abi) as IEVMScriptExecutorInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): IEVMScriptExecutor {
    return new Contract(address, _abi, runner) as unknown as IEVMScriptExecutor;
  }
}
