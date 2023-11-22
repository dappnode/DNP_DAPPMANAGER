/**
 * Common types for Smart Contracts
 */

interface FunctionAbi {
  type: "function";
  stateMutability: "view" | "nonpayable" | "payable" | "pure";
  outputs: { type: string; name: string; internalType?: string }[];
  name: string;
  inputs: { type: string; name: string; internalType?: string }[];
  constant: boolean;
  payable: boolean;
}

interface EventAbi {
  type: "event";
  name: string;
  inputs: {
    type: string;
    name: string;
    indexed: boolean;
    internalType?: string;
  }[];
  anonymous?: boolean;
}

interface ConstructorAbi {
  type: "constructor";
  inputs: {
    type: string;
    name: string;
  }[];
  payable: boolean;
  stateMutability: "nonpayable";
}

export type Abi = (FunctionAbi | EventAbi | ConstructorAbi)[];
