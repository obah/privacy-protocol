//SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IPrivacyProtocolPool {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    error PrivacyProtocolPool__CommitmentAlreadyUsed(bytes32 commitment);
    error PrivacyProtocolPool__InvalidProof();
    error PrivacyProtocolPool__TokenNotSupported(address token);
    error PrivacyProtocolPool__AddressZero();
    error PrivacyProtocolPool__ExecutionFailed();
    error PrivacyProtocolPool__InvalidAmount();
    error PrivacyProtocolPool__InvalidRootHash(bytes32 rootHash);
    error PrivacyProtocolPool__NullifierUsed(bytes32 nullifierHash);
    error PrivacyProtocolPool__TokenSupported(address token);

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event PrivacyProtocolPool__Deposit(
        address indexed token,
        bytes32 indexed commitment,
        uint256 indexed amount,
        uint32 insertedLeafIndex,
        uint256 timestamp
    );

    event PrivacyProtocolPool__ActionExecuted(bytes32 nullifierHash, address proxy);

    event PrivacyProtocolPool__Withdrawal(
        bytes32 indexed newCommitment,
        address indexed recipient,
        address indexed token,
        uint256 amount,
        uint32 insertedLeafIndex,
        uint256 timestamp
    );

    event PrivacyProtocolPool__TokenAdded(address indexed token, uint256 indexed timestamp);

    event PrivacyProtocolPool__TokenRemoved(address indexed token, uint256 indexed timestamp);

    event PrivacyProtocolPool__VerifierUpdated(address indexed verifier, uint256 indexed timestamp);

    /*//////////////////////////////////////////////////////////////
                            USER ACTIONS
    //////////////////////////////////////////////////////////////*/

    /// Deposit a new UTXO commitment
    /**
     * @notice Create initial UTXOs from deposit (no inputs consumed)
     * @param token The ERC20 token address
     * @param amount The total amount being deposited
     * @param commitment commitment that outputs sum to amount
     *
     * Example: Deposit 100 USDC → Creates 1 UTXO of 100 USDC
     */
    function deposit(address token, uint256 amount, bytes32 commitment) external;

    /**
     * @notice Withdraw by consuming inputs without creating outputs
     * @param token The token to withdraw
     * @param recipient The address to receive tokens
     * @param amount The total amount to withdraw
     * @param nullifierHash The nullifier hash of the UTXO being withdrawn
     * @param proof ZK proof that inputs sum to amount
     * @param rootHash The root hash of the Merkle tree
     * @param calldataHash The hash of the calldata
     * @param newCommitment The new commitment to be inserted into the tree
     *
     * Example: User has UTXO(70) → Withdraw all 70 USDC
     *   Inputs: [UTXO(70)]
     *   Outputs: [] (no change)
     *   Recipient receives 70 USDC
     */
    function withdraw(
        address token,
        address recipient,
        uint256 amount,
        bytes32 nullifierHash,
        bytes calldata proof,
        bytes32 rootHash,
        bytes32 calldataHash,
        bytes32 newCommitment
    ) external;

    struct ActionRequest {
        address token;
        uint256 amount;
        address target;
        bytes data;
        bytes32 actionId;
        bytes32 nullifierHash;
        bytes proof;
        bytes32 rootHash;
        bytes32 newCommitment;
    }

    /**
     * @notice Execute an action by consuming inputs and creating outputs
     * @param request The action request struct
     * @return success Whether the action succeeded
     */
    function executeAction(ActionRequest calldata request) external returns (bool success);

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Check if a token is supported
     * @param token The token address
     * @return supported Whether the token is supported
     */
    function isTokenSupported(address token) external view returns (bool);

    /**
     * @notice Get the verifier contract address
     * @return verifier The verifier contract address
     */
    function getVerifier() external view returns (address);

    // ============ ADMIN FUNCTIONS ============

    function addSupportedToken(address token) external;
    function removeSupportedToken(address token) external;
    function updateVerifier(address newVerifier) external;
}
