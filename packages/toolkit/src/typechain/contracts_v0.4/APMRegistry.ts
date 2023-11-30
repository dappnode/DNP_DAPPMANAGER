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
} from "../common.js";

export interface APMRegistryInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "REPO_APP_NAME"
      | "APM_APP_NAME"
      | "ENS_SUB_APP_NAME"
      | "registrar"
      | "CREATE_REPO_ROLE"
      | "EVMSCRIPT_REGISTRY_APP_ID"
      | "appId"
      | "getInitializationBlock"
      | "EVMSCRIPT_REGISTRY_APP"
      | "canPerform"
      | "newAppProxyPinned(address,bytes32,bytes)"
      | "newAppProxyPinned(address,bytes32)"
      | "kernel"
      | "newAppProxy(address,bytes32)"
      | "newAppProxy(address,bytes32,bytes)"
      | "getExecutor"
      | "initialize"
      | "newRepo"
      | "newRepoWithVersion"
  ): FunctionFragment;

  getEvent(nameOrSignatureOrTopic: "NewRepo" | "NewAppProxy"): EventFragment;

  encodeFunctionData(
    functionFragment: "REPO_APP_NAME",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "APM_APP_NAME",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "ENS_SUB_APP_NAME",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "registrar", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "CREATE_REPO_ROLE",
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
    functionFragment: "EVMSCRIPT_REGISTRY_APP",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "canPerform",
    values: [AddressLike, BytesLike, BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "newAppProxyPinned(address,bytes32,bytes)",
    values: [AddressLike, BytesLike, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "newAppProxyPinned(address,bytes32)",
    values: [AddressLike, BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "kernel", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "newAppProxy(address,bytes32)",
    values: [AddressLike, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "newAppProxy(address,bytes32,bytes)",
    values: [AddressLike, BytesLike, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getExecutor",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "newRepo",
    values: [string, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "newRepoWithVersion",
    values: [
      string,
      AddressLike,
      [BigNumberish, BigNumberish, BigNumberish],
      AddressLike,
      BytesLike
    ]
  ): string;

  decodeFunctionResult(
    functionFragment: "REPO_APP_NAME",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "APM_APP_NAME",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "ENS_SUB_APP_NAME",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "registrar", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "CREATE_REPO_ROLE",
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
    functionFragment: "EVMSCRIPT_REGISTRY_APP",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "canPerform", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "newAppProxyPinned(address,bytes32,bytes)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "newAppProxyPinned(address,bytes32)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "kernel", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "newAppProxy(address,bytes32)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "newAppProxy(address,bytes32,bytes)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getExecutor",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "newRepo", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "newRepoWithVersion",
    data: BytesLike
  ): Result;
}

export namespace NewRepoEvent {
  export type InputTuple = [id: BytesLike, name: string, repo: AddressLike];
  export type OutputTuple = [id: string, name: string, repo: string];
  export interface OutputObject {
    id: string;
    name: string;
    repo: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace NewAppProxyEvent {
  export type InputTuple = [proxy: AddressLike];
  export type OutputTuple = [proxy: string];
  export interface OutputObject {
    proxy: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface APMRegistry extends BaseContract {
  connect(runner?: ContractRunner | null): APMRegistry;
  waitForDeployment(): Promise<this>;

  interface: APMRegistryInterface;

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

  REPO_APP_NAME: TypedContractMethod<[], [string], "view">;

  APM_APP_NAME: TypedContractMethod<[], [string], "view">;

  ENS_SUB_APP_NAME: TypedContractMethod<[], [string], "view">;

  registrar: TypedContractMethod<[], [string], "view">;

  CREATE_REPO_ROLE: TypedContractMethod<[], [string], "view">;

  EVMSCRIPT_REGISTRY_APP_ID: TypedContractMethod<[], [string], "view">;

  appId: TypedContractMethod<[], [string], "view">;

  /**
   * @returns Block number in which the contract was initialized
   */
  getInitializationBlock: TypedContractMethod<[], [bigint], "view">;

  EVMSCRIPT_REGISTRY_APP: TypedContractMethod<[], [string], "view">;

  canPerform: TypedContractMethod<
    [_sender: AddressLike, _role: BytesLike, params: BigNumberish[]],
    [boolean],
    "view"
  >;

  "newAppProxyPinned(address,bytes32,bytes)": TypedContractMethod<
    [_kernel: AddressLike, _appId: BytesLike, _initializePayload: BytesLike],
    [string],
    "nonpayable"
  >;

  "newAppProxyPinned(address,bytes32)": TypedContractMethod<
    [_kernel: AddressLike, _appId: BytesLike],
    [string],
    "nonpayable"
  >;

  kernel: TypedContractMethod<[], [string], "view">;

  "newAppProxy(address,bytes32)": TypedContractMethod<
    [_kernel: AddressLike, _appId: BytesLike],
    [string],
    "nonpayable"
  >;

  "newAppProxy(address,bytes32,bytes)": TypedContractMethod<
    [_kernel: AddressLike, _appId: BytesLike, _initializePayload: BytesLike],
    [string],
    "nonpayable"
  >;

  getExecutor: TypedContractMethod<[_script: BytesLike], [string], "view">;

  /**
   * NEEDS CREATE_NAME_ROLE and POINT_ROOTNODE_ROLE permissions on registrar
   * @param _registrar ENSSubdomainRegistrar instance that holds registry root node ownership
   */
  initialize: TypedContractMethod<
    [_registrar: AddressLike],
    [void],
    "nonpayable"
  >;

  /**
   * Create new repo in registry with `_name`
   * @param _dev Address that will be given permission to create versions
   * @param _name Repo name, must be ununsed
   */
  newRepo: TypedContractMethod<
    [_name: string, _dev: AddressLike],
    [string],
    "nonpayable"
  >;

  /**
   * Create new repo in registry with `_name` and first repo version
   * @param _contentURI External URI for fetching new version's content
   * @param _contractAddress address for smart contract logic for version (if set to 0, it uses last versions' contractAddress)
   * @param _dev Address that will be given permission to create versions
   * @param _initialSemanticVersion Semantic version for new repo version
   * @param _name Repo name
   */
  newRepoWithVersion: TypedContractMethod<
    [
      _name: string,
      _dev: AddressLike,
      _initialSemanticVersion: [BigNumberish, BigNumberish, BigNumberish],
      _contractAddress: AddressLike,
      _contentURI: BytesLike
    ],
    [string],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "REPO_APP_NAME"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "APM_APP_NAME"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "ENS_SUB_APP_NAME"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "registrar"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "CREATE_REPO_ROLE"
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
    nameOrSignature: "newAppProxyPinned(address,bytes32,bytes)"
  ): TypedContractMethod<
    [_kernel: AddressLike, _appId: BytesLike, _initializePayload: BytesLike],
    [string],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "newAppProxyPinned(address,bytes32)"
  ): TypedContractMethod<
    [_kernel: AddressLike, _appId: BytesLike],
    [string],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "kernel"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "newAppProxy(address,bytes32)"
  ): TypedContractMethod<
    [_kernel: AddressLike, _appId: BytesLike],
    [string],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "newAppProxy(address,bytes32,bytes)"
  ): TypedContractMethod<
    [_kernel: AddressLike, _appId: BytesLike, _initializePayload: BytesLike],
    [string],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "getExecutor"
  ): TypedContractMethod<[_script: BytesLike], [string], "view">;
  getFunction(
    nameOrSignature: "initialize"
  ): TypedContractMethod<[_registrar: AddressLike], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "newRepo"
  ): TypedContractMethod<
    [_name: string, _dev: AddressLike],
    [string],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "newRepoWithVersion"
  ): TypedContractMethod<
    [
      _name: string,
      _dev: AddressLike,
      _initialSemanticVersion: [BigNumberish, BigNumberish, BigNumberish],
      _contractAddress: AddressLike,
      _contentURI: BytesLike
    ],
    [string],
    "nonpayable"
  >;

  getEvent(
    key: "NewRepo"
  ): TypedContractEvent<
    NewRepoEvent.InputTuple,
    NewRepoEvent.OutputTuple,
    NewRepoEvent.OutputObject
  >;
  getEvent(
    key: "NewAppProxy"
  ): TypedContractEvent<
    NewAppProxyEvent.InputTuple,
    NewAppProxyEvent.OutputTuple,
    NewAppProxyEvent.OutputObject
  >;

  filters: {
    "NewRepo(bytes32,string,address)": TypedContractEvent<
      NewRepoEvent.InputTuple,
      NewRepoEvent.OutputTuple,
      NewRepoEvent.OutputObject
    >;
    NewRepo: TypedContractEvent<
      NewRepoEvent.InputTuple,
      NewRepoEvent.OutputTuple,
      NewRepoEvent.OutputObject
    >;

    "NewAppProxy(address)": TypedContractEvent<
      NewAppProxyEvent.InputTuple,
      NewAppProxyEvent.OutputTuple,
      NewAppProxyEvent.OutputObject
    >;
    NewAppProxy: TypedContractEvent<
      NewAppProxyEvent.InputTuple,
      NewAppProxyEvent.OutputTuple,
      NewAppProxyEvent.OutputObject
    >;
  };
}