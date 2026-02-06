use dep::poseidon::poseidon2::Poseidon2::hash;

mod merkle_tree;

fn main(
    //public inputs
    root_hash: pub Field,
    nullifier_hash: pub Field,
    recipient_address: pub Field,
    data_hash: pub Field, // 248-bit truncated Keccak256 hash of the calldata (binds the action)
    amount_to_withdraw: pub Field,
    new_commitment: pub Field,
    //private inputs
    nullifier: Field,
    new_nullifier: Field,
    secret: Field,
    amount_in_pool: Field,
    amount_left: Field,
    merkle_proof: [Field; 20],
    is_even: [bool; 20],
) {
    // check that the amounts are valid
    assert(amount_in_pool == amount_to_withdraw + amount_left, "Invalid amounts");

    // compute the commitment using Poseidon(nullifier, secret)
    let commitment: Field = hash([nullifier, secret, amount_in_pool], 3);

    // check nullifier matches nullifier hash
    let computed_nullifier_hash: Field = hash([nullifier], 1);
    assert(computed_nullifier_hash == nullifier_hash, "Invalid nullifier hash");

    // Bind external parameters to the circuit
    assert(recipient_address == recipient_address);
    assert(data_hash == data_hash);

    //check the commitment is in the merkle tree
    let computed_merkle_root = merkle_tree::compute_merkle_root(commitment, merkle_proof, is_even);
    assert(computed_merkle_root == root_hash, "Invalid merkle proof");

    //check the new_commitment is valid
    let computed_new_commitment: Field = hash([new_nullifier, secret, amount_left], 3);
    assert(computed_new_commitment == new_commitment, "Invalid new commitment");
}
