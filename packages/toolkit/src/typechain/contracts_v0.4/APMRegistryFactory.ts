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
} from "../common";

export interface APMRegistryFactoryInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "REPO_APP_NAME"
      | "APM_APP_NAME"
      | "ENS_SUB_APP_NAME"
      | "registryBase"
      | "ensSubdomainRegistrarBase"
      | "ens"
      | "daoFactory"
      | "repoBase"
      | "newAPM"
  ): FunctionFragment;

  getEvent(nameOrSignatureOrTopic: "DeployAPM"): EventFragment;

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
  encodeFunctionData(
    functionFragment: "registryBase",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "ensSubdomainRegistrarBase",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "ens", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "daoFactory",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "repoBase", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "newAPM",
    values: [BytesLike, BytesLike, AddressLike]
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
  decodeFunctionResult(
    functionFragment: "registryBase",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "ensSubdomainRegistrarBase",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "ens", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "daoFactory", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "repoBase", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "newAPM", data: BytesLike): Result;
}

export namespace DeployAPMEvent {
  export type InputTuple = [node: BytesLike, apm: AddressLike];
  export type OutputTuple = [node: string, apm: string];
  export interface OutputObject {
    node: string;
    apm: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface APMRegistryFactory extends BaseContract {
  connect(runner?: ContractRunner | null): BaseContract;
  attach(addressOrName: AddressLike): this;
  deployed(): Promise<this>;

  interface: APMRegistryFactoryInterface;

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

  registryBase: TypedContractMethod<[], [string], "view">;

  ensSubdomainRegistrarBase: TypedContractMethod<[], [string], "view">;

  ens: TypedContractMethod<[], [string], "view">;

  daoFactory: TypedContractMethod<[], [string], "view">;

  repoBase: TypedContractMethod<[], [string], "view">;

  newAPM: TypedContractMethod<
    [_tld: BytesLike, _label: BytesLike, _root: AddressLike],
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
    nameOrSignature: "registryBase"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "ensSubdomainRegistrarBase"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "ens"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "daoFactory"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "repoBase"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "newAPM"
  ): TypedContractMethod<
    [_tld: BytesLike, _label: BytesLike, _root: AddressLike],
    [string],
    "nonpayable"
  >;

  getEvent(
    key: "DeployAPM"
  ): TypedContractEvent<
    DeployAPMEvent.InputTuple,
    DeployAPMEvent.OutputTuple,
    DeployAPMEvent.OutputObject
  >;

  filters: {
    "DeployAPM(bytes32,address)": TypedContractEvent<
      DeployAPMEvent.InputTuple,
      DeployAPMEvent.OutputTuple,
      DeployAPMEvent.OutputObject
    >;
    DeployAPM: TypedContractEvent<
      DeployAPMEvent.InputTuple,
      DeployAPMEvent.OutputTuple,
      DeployAPMEvent.OutputObject
    >;
  };
}
