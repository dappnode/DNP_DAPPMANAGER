import { DNPRegistryEntry, PublicRegistryEntry, Registry } from "./types.js";
import { request, gql } from "graphql-request";
import { dnpRegistryGraphEndpoint, publicRegistryGraphEndpoint } from "./params.js";

// TODO: Consider adding scanning functions for events

/**
 * DappNodeRegistry is a class to interact with the DAppNode Registry Contract.
 */
export class DappNodeRegistry {
  private registry: Registry;
  private graphEndpoint: string;
  private nameSuffix: string;

  /**
   * Class constructor
   * @param ethUrl - The URL of the Ethereum node to connect to.
   * @param registry - The type of the registry (DNP or Public).
   */
  constructor(registry: Registry) {
    this.registry = registry;
    if (registry === "dnp") this.graphEndpoint = dnpRegistryGraphEndpoint;
    else this.graphEndpoint = publicRegistryGraphEndpoint;

    this.nameSuffix = this.registry === "dnp" ? ".dnp.dappnode.eth" : ".public.dappnode.eth";
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
    const result = ((await request(this.graphEndpoint, query)) as any).newRepos;

    // Append suffix
    return result.map((repo: DNPRegistryEntry | PublicRegistryEntry) => {
      repo.name = repo.name + this.nameSuffix;
      return repo;
    });
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
