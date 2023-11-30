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
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedListener,
  TypedContractMethod,
} from "../common.js";

export interface AragonAppInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "EVMSCRIPT_REGISTRY_APP_ID"
      | "appId"
      | "getInitializationBlock"
      | "EVMSCRIPT_REGISTRY_APP"
      | "kernel"
      | "getExecutor"
      | "canPerform"
  ): FunctionFragment;

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
  encodeFunctionData(functionFragment: "kernel", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "getExecutor",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "canPerform",
    values: [AddressLike, BytesLike, BigNumberish[]]
  ): string;

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
  decodeFunctionResult(functionFragment: "kernel", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getExecutor",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "canPerform", data: BytesLike): Result;
}

export interface AragonApp extends BaseContract {
  connect(runner?: ContractRunner | null): AragonApp;
  waitForDeployment(): Promise<this>;

  interface: AragonAppInterface;

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

  EVMSCRIPT_REGISTRY_APP_ID: TypedContractMethod<[], [string], "view">;

  appId: TypedContractMethod<[], [string], "view">;

  /**
   * @returns Block number in which the contract was initialized
   */
  getInitializationBlock: TypedContractMethod<[], [bigint], "view">;

  EVMSCRIPT_REGISTRY_APP: TypedContractMethod<[], [string], "view">;

  kernel: TypedContractMethod<[], [string], "view">;

  getExecutor: TypedContractMethod<[_script: BytesLike], [string], "view">;

  canPerform: TypedContractMethod<
    [_sender: AddressLike, _role: BytesLike, params: BigNumberish[]],
    [boolean],
    "view"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

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
    nameOrSignature: "kernel"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "getExecutor"
  ): TypedContractMethod<[_script: BytesLike], [string], "view">;
  getFunction(
    nameOrSignature: "canPerform"
  ): TypedContractMethod<
    [_sender: AddressLike, _role: BytesLike, params: BigNumberish[]],
    [boolean],
    "view"
  >;

  filters: {};
}