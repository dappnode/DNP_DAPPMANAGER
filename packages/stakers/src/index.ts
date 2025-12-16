// Core infrastructure
export { BlockchainComponent } from "./core/index.js";
export type { CompatibleClient } from "./core/index.js";

// L1 Staker components (Proof of Stake blockchains)
export { Consensus, Execution, MevBoost, Signer, StakerComponent } from "./l1/index.js";

// L2 components
export { L2Component, StarknetNodeComponent, StarknetSignerComponent } from "./l2/index.js";
