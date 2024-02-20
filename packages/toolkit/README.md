# DappNode Toolkit

This repository contains a collection of modules and tools designed to simplify interaction with the Aragon Package Manager (Registry and Repository) and the Dappnode Directory Smart Contract.

## Considerations

Please note that this NPM package is not compatible with browsers, as it includes Node.js native file system modules.

## Integrations

The toolkit offers multiple integrations with various tools available in the JavaScript ecosystem, aiming to streamline and enhance the usage of Dappnode Smart Contracts:

### TheGraph

The Registry Smart Contract interacts with both the `public` and `dnp` Registries Smart Contracts. There are two methods for obtaining Dappnode packages from either the `dnp` or `public` Registries Smart Contracts: scanning the blockchain for the `NewRepo` event, and using TheGraph to collect all the events for each Smart Contract.

Two subgraphs have been deployed to facilitate the retrieval of these events.

### Truffle

All the smart contracts are compiled using Truffle. These compilations are subsequently utilized by Ethers and TypeChain.

### Typechain

To ensure proper typing in TypeScript, the TypeChain tool generates types from the compiled Smart Contracts created by Truffle.

## Modules

- **Registry**: This module manages the registries available in Dappnode: `dnp.dappnode.eth` and `public.dappnode.eth`. The `dnp` registry is maintained by the Dappnode organization, while the `public` registry is accessible to anyone wishing to publish their own package. The Registry module utilizes TheGraph, among other tools, to search for `NewRepo` events emitted by each Smart Contract Registry. It also fetches all the Dappnode packages under each registry and utilizes the Repository module to retrieve all the Dappnode package release assets.
- **Directory**: This module interacts with the Dappnode Directory Smart Contract, which defines the Dappnode packages available in the DappStore for both `dnp` and `public` Dappnode packages. The Smart Contract determines the whitelist of Dappnode packages, their position, and the featured index.
- **Repository**: This module manages the Repository Smart Contract to which each Dappnode package ENS resolves. It enables fetching IPFS hashes based on provided versions, resolving these IPFS hashes using an IPFS URL, and supports both IPFS gateways and APIs. Content trust verification for IPFS gateways is also available (with `dag`).
- **Typechain**: This module contains the Smart Contract types created with TypeChain and the compiled Smart Contracts by Truffle. It allows for typed Smart Contracts using the Ethers library.

## Testing

Tests are available for the following Smart Contracts modules:

- Registry: Tests the integration with TheGraph to fetch all the Dappnode packages for each registry: `dnp` and `public`.
- Directory: Tests the Directory Smart Contract by fetching its content.
- Repository: Tests random Dappnode packages by fetching IPFS hashes with different versions and retrieving their content on an IPFS node.

## Roadmap

To establish a clear roadmap for this toolkit, it would be beneficial to have a

## Contributing

We welcome contributions to the DappNode Toolkit. Please refer to the `CONTRIBUTING.md` file for guidelines on how to contribute.

## License

The DappNode Toolkit is released under the MIT License. For more information, please refer to the `LICENSE` file.

- Responsibles:
  - @pablomendezroyo
  - @dappnodedev
  - @Marketen
  - @3alpha
