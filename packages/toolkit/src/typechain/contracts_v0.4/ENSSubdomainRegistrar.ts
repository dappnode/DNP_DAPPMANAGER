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

export interface ENSSubdomainRegistrarInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "POINT_ROOTNODE_ROLE"
      | "ens"
      | "PUBLIC_RESOLVER_NODE"
      | "EVMSCRIPT_REGISTRY_APP_ID"
      | "appId"
      | "getInitializationBlock"
      | "ETH_TLD_LABEL"
      | "EVMSCRIPT_REGISTRY_APP"
      | "canPerform"
      | "ENS_ROOT"
      | "DELETE_NAME_ROLE"
      | "PUBLIC_RESOLVER_LABEL"
      | "kernel"
      | "getExecutor"
      | "rootNode"
      | "ETH_TLD_NODE"
      | "CREATE_NAME_ROLE"
      | "initialize"
      | "createName"
      | "createNameAndPoint"
      | "deleteName"
      | "pointRootNode"
  ): FunctionFragment;

  getEvent(nameOrSignatureOrTopic: "NewName" | "DeleteName"): EventFragment;

  encodeFunctionData(
    functionFragment: "POINT_ROOTNODE_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "ens", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "PUBLIC_RESOLVER_NODE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "EVMSCRIPT_REGISTRY_APP_ID",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "appId", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "getInitializationBlock",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "ETH_TLD_LABEL",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "EVMSCRIPT_REGISTRY_APP",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "canPerform",
    values: [AddressLike, BytesLike, BigNumberish[]]
  ): string;
  encodeFunctionData(functionFragment: "ENS_ROOT", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "DELETE_NAME_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "PUBLIC_RESOLVER_LABEL",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "kernel", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "getExecutor",
    values: [BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "rootNode", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "ETH_TLD_NODE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "CREATE_NAME_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values: [AddressLike, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "createName",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "createNameAndPoint",
    values: [BytesLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "deleteName",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "pointRootNode",
    values: [AddressLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "POINT_ROOTNODE_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "ens", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "PUBLIC_RESOLVER_NODE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "EVMSCRIPT_REGISTRY_APP_ID",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "appId", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getInitializationBlock",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "ETH_TLD_LABEL",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "EVMSCRIPT_REGISTRY_APP",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "canPerform", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "ENS_ROOT", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "DELETE_NAME_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "PUBLIC_RESOLVER_LABEL",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "kernel", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getExecutor",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "rootNode", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "ETH_TLD_NODE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "CREATE_NAME_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "createName", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "createNameAndPoint",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "deleteName", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "pointRootNode",
    data: BytesLike
  ): Result;
}

export namespace NewNameEvent {
  export type InputTuple = [node: BytesLike, label: BytesLike];
  export type OutputTuple = [node: string, label: string];
  export interface OutputObject {
    node: string;
    label: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace DeleteNameEvent {
  export type InputTuple = [node: BytesLike, label: BytesLike];
  export type OutputTuple = [node: string, label: string];
  export interface OutputObject {
    node: string;
    label: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface ENSSubdomainRegistrar extends BaseContract {
  connect(runner?: ContractRunner | null): BaseContract;
  attach(addressOrName: AddressLike): this;
  deployed(): Promise<this>;

  interface: ENSSubdomainRegistrarInterface;

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

  POINT_ROOTNODE_ROLE: TypedContractMethod<[], [string], "view">;

  ens: TypedContractMethod<[], [string], "view">;

  PUBLIC_RESOLVER_NODE: TypedContractMethod<[], [string], "view">;

  EVMSCRIPT_REGISTRY_APP_ID: TypedContractMethod<[], [string], "view">;

  appId: TypedContractMethod<[], [string], "view">;

  /**
   * @returns Block number in which the contract was initialized
   */
  getInitializationBlock: TypedContractMethod<[], [bigint], "view">;

  ETH_TLD_LABEL: TypedContractMethod<[], [string], "view">;

  EVMSCRIPT_REGISTRY_APP: TypedContractMethod<[], [string], "view">;

  canPerform: TypedContractMethod<
    [_sender: AddressLike, _role: BytesLike, params: BigNumberish[]],
    [boolean],
    "view"
  >;

  ENS_ROOT: TypedContractMethod<[], [string], "view">;

  DELETE_NAME_ROLE: TypedContractMethod<[], [string], "view">;

  PUBLIC_RESOLVER_LABEL: TypedContractMethod<[], [string], "view">;

  kernel: TypedContractMethod<[], [string], "view">;

  getExecutor: TypedContractMethod<[_script: BytesLike], [string], "view">;

  rootNode: TypedContractMethod<[], [string], "view">;

  ETH_TLD_NODE: TypedContractMethod<[], [string], "view">;

  CREATE_NAME_ROLE: TypedContractMethod<[], [string], "view">;

  initialize: TypedContractMethod<
    [_ens: AddressLike, _rootNode: BytesLike],
    [void],
    "nonpayable"
  >;

  createName: TypedContractMethod<
    [_label: BytesLike, _owner: AddressLike],
    [string],
    "nonpayable"
  >;

  createNameAndPoint: TypedContractMethod<
    [_label: BytesLike, _target: AddressLike],
    [string],
    "nonpayable"
  >;

  deleteName: TypedContractMethod<[_label: BytesLike], [void], "nonpayable">;

  pointRootNode: TypedContractMethod<
    [_target: AddressLike],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "POINT_ROOTNODE_ROLE"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "ens"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "PUBLIC_RESOLVER_NODE"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "EVMSCRIPT_REGISTRY_APP_ID"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "appId"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "getInitializationBlock"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "ETH_TLD_LABEL"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "EVMSCRIPT_REGISTRY_APP"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "canPerform"
  ): TypedContractMethod<
    [_sender: AddressLike, _role: BytesLike, params: BigNumberish[]],
    [boolean],
    "view"
  >;
  getFunction(
    nameOrSignature: "ENS_ROOT"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "DELETE_NAME_ROLE"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "PUBLIC_RESOLVER_LABEL"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "kernel"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "getExecutor"
  ): TypedContractMethod<[_script: BytesLike], [string], "view">;
  getFunction(
    nameOrSignature: "rootNode"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "ETH_TLD_NODE"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "CREATE_NAME_ROLE"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "initialize"
  ): TypedContractMethod<
    [_ens: AddressLike, _rootNode: BytesLike],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "createName"
  ): TypedContractMethod<
    [_label: BytesLike, _owner: AddressLike],
    [string],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "createNameAndPoint"
  ): TypedContractMethod<
    [_label: BytesLike, _target: AddressLike],
    [string],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "deleteName"
  ): TypedContractMethod<[_label: BytesLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "pointRootNode"
  ): TypedContractMethod<[_target: AddressLike], [void], "nonpayable">;

  getEvent(
    key: "NewName"
  ): TypedContractEvent<
    NewNameEvent.InputTuple,
    NewNameEvent.OutputTuple,
    NewNameEvent.OutputObject
  >;
  getEvent(
    key: "DeleteName"
  ): TypedContractEvent<
    DeleteNameEvent.InputTuple,
    DeleteNameEvent.OutputTuple,
    DeleteNameEvent.OutputObject
  >;

  filters: {
    "NewName(bytes32,bytes32)": TypedContractEvent<
      NewNameEvent.InputTuple,
      NewNameEvent.OutputTuple,
      NewNameEvent.OutputObject
    >;
    NewName: TypedContractEvent<
      NewNameEvent.InputTuple,
      NewNameEvent.OutputTuple,
      NewNameEvent.OutputObject
    >;

    "DeleteName(bytes32,bytes32)": TypedContractEvent<
      DeleteNameEvent.InputTuple,
      DeleteNameEvent.OutputTuple,
      DeleteNameEvent.OutputObject
    >;
    DeleteName: TypedContractEvent<
      DeleteNameEvent.InputTuple,
      DeleteNameEvent.OutputTuple,
      DeleteNameEvent.OutputObject
    >;
  };
}
