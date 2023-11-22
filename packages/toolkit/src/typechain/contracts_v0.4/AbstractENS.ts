/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
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
} from "../common";

export interface AbstractENSInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "owner"
      | "resolver"
      | "ttl"
      | "setOwner"
      | "setSubnodeOwner"
      | "setResolver"
      | "setTTL"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic: "NewOwner" | "Transfer" | "NewResolver" | "NewTTL"
  ): EventFragment;

  encodeFunctionData(functionFragment: "owner", values: [BytesLike]): string;
  encodeFunctionData(functionFragment: "resolver", values: [BytesLike]): string;
  encodeFunctionData(functionFragment: "ttl", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "setOwner",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "setSubnodeOwner",
    values: [BytesLike, BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "setResolver",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "setTTL",
    values: [BytesLike, BigNumberish]
  ): string;

  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "resolver", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "ttl", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setOwner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setSubnodeOwner",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setResolver",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "setTTL", data: BytesLike): Result;
}

export namespace NewOwnerEvent {
  export type InputTuple = [
    _node: BytesLike,
    _label: BytesLike,
    _owner: AddressLike
  ];
  export type OutputTuple = [_node: string, _label: string, _owner: string];
  export interface OutputObject {
    _node: string;
    _label: string;
    _owner: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace TransferEvent {
  export type InputTuple = [_node: BytesLike, _owner: AddressLike];
  export type OutputTuple = [_node: string, _owner: string];
  export interface OutputObject {
    _node: string;
    _owner: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace NewResolverEvent {
  export type InputTuple = [_node: BytesLike, _resolver: AddressLike];
  export type OutputTuple = [_node: string, _resolver: string];
  export interface OutputObject {
    _node: string;
    _resolver: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace NewTTLEvent {
  export type InputTuple = [_node: BytesLike, _ttl: BigNumberish];
  export type OutputTuple = [_node: string, _ttl: bigint];
  export interface OutputObject {
    _node: string;
    _ttl: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface AbstractENS extends BaseContract {
  connect(runner?: ContractRunner | null): BaseContract;
  attach(addressOrName: AddressLike): this;
  deployed(): Promise<this>;

  interface: AbstractENSInterface;

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

  owner: TypedContractMethod<[_node: BytesLike], [string], "view">;

  resolver: TypedContractMethod<[_node: BytesLike], [string], "view">;

  ttl: TypedContractMethod<[_node: BytesLike], [bigint], "view">;

  setOwner: TypedContractMethod<
    [_node: BytesLike, _owner: AddressLike],
    [void],
    "nonpayable"
  >;

  setSubnodeOwner: TypedContractMethod<
    [_node: BytesLike, label: BytesLike, _owner: AddressLike],
    [void],
    "nonpayable"
  >;

  setResolver: TypedContractMethod<
    [_node: BytesLike, _resolver: AddressLike],
    [void],
    "nonpayable"
  >;

  setTTL: TypedContractMethod<
    [_node: BytesLike, _ttl: BigNumberish],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "owner"
  ): TypedContractMethod<[_node: BytesLike], [string], "view">;
  getFunction(
    nameOrSignature: "resolver"
  ): TypedContractMethod<[_node: BytesLike], [string], "view">;
  getFunction(
    nameOrSignature: "ttl"
  ): TypedContractMethod<[_node: BytesLike], [bigint], "view">;
  getFunction(
    nameOrSignature: "setOwner"
  ): TypedContractMethod<
    [_node: BytesLike, _owner: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "setSubnodeOwner"
  ): TypedContractMethod<
    [_node: BytesLike, label: BytesLike, _owner: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "setResolver"
  ): TypedContractMethod<
    [_node: BytesLike, _resolver: AddressLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "setTTL"
  ): TypedContractMethod<
    [_node: BytesLike, _ttl: BigNumberish],
    [void],
    "nonpayable"
  >;

  getEvent(
    key: "NewOwner"
  ): TypedContractEvent<
    NewOwnerEvent.InputTuple,
    NewOwnerEvent.OutputTuple,
    NewOwnerEvent.OutputObject
  >;
  getEvent(
    key: "Transfer"
  ): TypedContractEvent<
    TransferEvent.InputTuple,
    TransferEvent.OutputTuple,
    TransferEvent.OutputObject
  >;
  getEvent(
    key: "NewResolver"
  ): TypedContractEvent<
    NewResolverEvent.InputTuple,
    NewResolverEvent.OutputTuple,
    NewResolverEvent.OutputObject
  >;
  getEvent(
    key: "NewTTL"
  ): TypedContractEvent<
    NewTTLEvent.InputTuple,
    NewTTLEvent.OutputTuple,
    NewTTLEvent.OutputObject
  >;

  filters: {
    "NewOwner(bytes32,bytes32,address)": TypedContractEvent<
      NewOwnerEvent.InputTuple,
      NewOwnerEvent.OutputTuple,
      NewOwnerEvent.OutputObject
    >;
    NewOwner: TypedContractEvent<
      NewOwnerEvent.InputTuple,
      NewOwnerEvent.OutputTuple,
      NewOwnerEvent.OutputObject
    >;

    "Transfer(bytes32,address)": TypedContractEvent<
      TransferEvent.InputTuple,
      TransferEvent.OutputTuple,
      TransferEvent.OutputObject
    >;
    Transfer: TypedContractEvent<
      TransferEvent.InputTuple,
      TransferEvent.OutputTuple,
      TransferEvent.OutputObject
    >;

    "NewResolver(bytes32,address)": TypedContractEvent<
      NewResolverEvent.InputTuple,
      NewResolverEvent.OutputTuple,
      NewResolverEvent.OutputObject
    >;
    NewResolver: TypedContractEvent<
      NewResolverEvent.InputTuple,
      NewResolverEvent.OutputTuple,
      NewResolverEvent.OutputObject
    >;

    "NewTTL(bytes32,uint64)": TypedContractEvent<
      NewTTLEvent.InputTuple,
      NewTTLEvent.OutputTuple,
      NewTTLEvent.OutputObject
    >;
    NewTTL: TypedContractEvent<
      NewTTLEvent.InputTuple,
      NewTTLEvent.OutputTuple,
      NewTTLEvent.OutputObject
    >;
  };
}
