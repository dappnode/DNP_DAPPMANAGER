/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "../common.js";

export interface CallsScriptInterface extends Interface {
  getFunction(nameOrSignature: "execScript"): FunctionFragment;

  getEvent(nameOrSignatureOrTopic: "LogScriptCall"): EventFragment;

  encodeFunctionData(
    functionFragment: "execScript",
    values: [BytesLike, BytesLike, AddressLike[]]
  ): string;

  decodeFunctionResult(functionFragment: "execScript", data: BytesLike): Result;
}

export namespace LogScriptCallEvent {
  export type InputTuple = [
    sender: AddressLike,
    src: AddressLike,
    dst: AddressLike
  ];
  export type OutputTuple = [sender: string, src: string, dst: string];
  export interface OutputObject {
    sender: string;
    src: string;
    dst: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface CallsScript extends BaseContract {
  connect(runner?: ContractRunner | null): CallsScript;
  waitForDeployment(): Promise<this>;

  interface: CallsScriptInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  /**
   * Executes a number of call scripts
   * @param _blacklist Addresses the script cannot call to, or will revert.
   * @param _input Input is ignored in callscript
   * @param _script [ specId (uint32) ] many calls with this structure ->   [ to (address: 20 bytes) ] [ calldataLength (uint32: 4 bytes) ] [ calldata (calldataLength bytes) ]
   * @returns always returns empty byte array
   */
  execScript: TypedContractMethod<
    [_script: BytesLike, _input: BytesLike, _blacklist: AddressLike[]],
    [string],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "execScript"
  ): TypedContractMethod<
    [_script: BytesLike, _input: BytesLike, _blacklist: AddressLike[]],
    [string],
    "nonpayable"
  >;

  getEvent(
    key: "LogScriptCall"
  ): TypedContractEvent<
    LogScriptCallEvent.InputTuple,
    LogScriptCallEvent.OutputTuple,
    LogScriptCallEvent.OutputObject
  >;

  filters: {
    "LogScriptCall(address,address,address)": TypedContractEvent<
      LogScriptCallEvent.InputTuple,
      LogScriptCallEvent.OutputTuple,
      LogScriptCallEvent.OutputObject
    >;
    LogScriptCall: TypedContractEvent<
      LogScriptCallEvent.InputTuple,
      LogScriptCallEvent.OutputTuple,
      LogScriptCallEvent.OutputObject
    >;
  };
}
