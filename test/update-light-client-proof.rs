// Run inside the pinned Helios source tree, using its recorded RPC fixtures.
use alloy::consensus::BlockHeader;
use alloy::network::BlockResponse;
use alloy::primitives::{Bytes, B256, U256};
use helios_core::execution::proof::{
    verify_account_proof, verify_code_hash_proof, verify_storage_proof,
};
use helios_test_utils::{rpc_account, rpc_block, rpc_proof};

#[test]
fn account_proof_rejects_a_forged_value_or_root() {
    let root = rpc_block().header().state_root();
    let mut proof = rpc_proof();
    assert!(verify_account_proof(&proof, root).is_ok());
    assert!(verify_account_proof(&proof, B256::ZERO).is_err());
    proof.balance += U256::from(1);
    assert!(verify_account_proof(&proof, root).is_err());
}

#[test]
fn storage_proof_rejects_a_substituted_registry_slot() {
    let mut proof = rpc_proof();
    assert!(!proof.storage_proof.is_empty());
    assert!(verify_storage_proof(&proof).is_ok());
    proof.storage_proof[0].value += U256::from(1);
    assert!(verify_storage_proof(&proof).is_err());
}

#[test]
fn code_proof_rejects_substituted_resolver_or_repository_bytecode() {
    let proof = rpc_proof();
    let mut code = rpc_account().code.unwrap().to_vec();
    assert!(verify_code_hash_proof(&proof, &Bytes::from(code.clone())).is_ok());
    code[0] ^= 1;
    assert!(verify_code_hash_proof(&proof, &Bytes::from(code)).is_err());
}
