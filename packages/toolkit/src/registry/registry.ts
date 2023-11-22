import { ethers } from "ethers";
import { APMRegistry, APMRegistry__factory } from "../typechain/index.js";
import { DNPRegistryEntry, PublicRegistryEntry, Registry } from "./types.js";
import { request, gql } from "graphql-request";
import {
  registryDnpAddress,
  dnpRegistryGraphEndpoint,
  registryPublicAddress,
  publicRegistryGraphEndpoint,
} from "./params.js";

// TODO: Consider adding scanning functions for events

/**
 * DappNodeRegistry is a class to interact with the DAppNode Registry Contract.
 */
export class DappNodeRegistry {
  private contractAddress: string;
  private registry: Registry;
  private graphEndpoint: string;
  private registryContract: APMRegistry;

  /**
   * Class constructor
   * @param ethUrl - The URL of the Ethereum node to connect to.
   * @param registry - The type of the registry (DNP or Public).
   */
  constructor(ethUrl: string, registry: Registry) {
    this.registry = registry;
    if (registry === "dnp") {
      this.contractAddress = registryDnpAddress;
      this.graphEndpoint = dnpRegistryGraphEndpoint;
    } else {
      this.contractAddress = registryPublicAddress;
      this.graphEndpoint = publicRegistryGraphEndpoint;
    }

    this.registryContract = APMRegistry__factory.connect(
      this.contractAddress,
      new ethers.JsonRpcProvider(ethUrl, "mainnet")
    );
  }

  /**
   * Fetches the packages for the given registry using graphQL.
   * @returns - A promise that resolves to an array of registry entries.
   */
  public async queryGraphNewRepos<T extends Registry>(): Promise<
    T extends "dnp" ? DNPRegistryEntry[] : PublicRegistryEntry[]
  > {
    const query = this.constructGraphQLQuery();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((await request(this.graphEndpoint, query)) as any).newRepos;
  }

  /**
   * Constructs the GraphQL query based on the type of the registry.
   * @returns - The GraphQL query string.
   */
  private constructGraphQLQuery(): string {
    return this.registry === "dnp"
      ? gql`
          query {
            newRepos {
              id
              Registry_id
              name
              repo
            }
          }
        `
      : gql`
          query {
            newRepos {
              id
              RegistryPublic_id
              name
              repo
            }
          }
        `;
  }
}
