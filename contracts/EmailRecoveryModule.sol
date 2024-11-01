// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IModule} from "./interfaces/IModule.sol";
import {IEmailRecoveryModule} from "@zk-email/email-recovery/src/interfaces/IEmailRecoveryModule.sol";
import {IClaveAccount} from "./interfaces/IClave.sol";
import {Errors} from "./libraries/Errors.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {EmailRecoveryManagerZkSync} from "@zk-email/email-recovery/src/EmailRecoveryManagerZkSync.sol";
import {GuardianManager} from "@zk-email/email-recovery/src/GuardianManager.sol";

contract EmailRecoveryModule is
    EmailRecoveryManagerZkSync,
    IModule,
    IEmailRecoveryModule
{
    /**
     * Account address to isInited
     */
    mapping(address account => bool) internal inited;

    /**
     * @notice Emitted when a recovery is executed
     * @param account address - Recovered account
     * @param newOwner bytes  - New owner of the account
     */
    event RecoveryExecuted(address indexed account, bytes newOwner);

    /**
     * @notice Initializes the EmailRecoveryModule contract
     * @param _verifier Address of the verifier contract
     * @param _dkimRegistry Address of the DKIM registry contract
     * @param _emailAuthImpl Address of the email auth implementation
     * @param _commandHandler Address of the command handler contract
     * @param _minimumDelay Minimum delay period
     * @param _factoryAddr Address of the factory contract
     * @param _proxyBytecodeHash The proxy contract bytecode hash
     */
    constructor(
        address _verifier,
        address _dkimRegistry,
        address _emailAuthImpl,
        address _commandHandler,
        uint256 _minimumDelay,
        address _factoryAddr,
        bytes32 _proxyBytecodeHash
    )
        EmailRecoveryManagerZkSync(
            _verifier,
            _dkimRegistry,
            _emailAuthImpl,
            _commandHandler,
            _minimumDelay,
            _factoryAddr,
            _proxyBytecodeHash
        )
    {}

    /**
     * @notice Initializes the recovery module for the calling account using the provided configuration data.
     *
     * @dev This function must be called only once during the lifecycle of the module for the given account.
     * - Ensures the module is properly initialized and no previous initialization has occurred for the account.
     *
     * @param initData bytes calldata - ABI encoded data containing the recovery configuration. The initData
     *   must encode the following parameters:
     *   - address[] guardians: An array of addresses representing the guardians who will participate in the recovery process.
     *   - uint256[] weights: An array of weights corresponding to each guardian, determining their influence in the recovery process.
     *   - uint256 threshold: The minimum combined weight required to approve and complete the recovery process.
     *   - uint256 delay: The time delay before the recovery can be executed after initiation.
     *   - uint256 expiry: The expiration time for the recovery attempt, after which it is no longer valid.
     */
    function init(bytes calldata initData) external override {
        if (isInited(msg.sender)) {
            revert Errors.ALREADY_INITED();
        }

        if (!IClaveAccount(msg.sender).isModule(address(this))) {
            revert Errors.MODULE_NOT_ADDED_CORRECTLY();
        }

        (
            address[] memory guardians,
            uint256[] memory weights,
            uint256 threshold,
            uint256 delay,
            uint256 expiry
        ) = abi.decode(
                initData,
                (address[], uint256[], uint256, uint256, uint256)
            );

        inited[msg.sender] = true;

        configureRecovery(guardians, weights, threshold, delay, expiry);

        emit Inited(msg.sender);
    }

    /**
     * @notice Disables the recovery module for the caller's account.
     * @dev It ensures that all state related to the recovery process for the caller's account is cleared by invoking deInitRecoveryModule.
     * @notice After calling this function, the recovery module will be deactivated and cannot be used unless reinitialized.
     */
    function disable() external override {
        inited[msg.sender] = false;

        deInitRecoveryModule();

        emit Disabled(msg.sender);
    }

    function canStartRecoveryRequest(
        address account
    ) external view returns (bool) {
        GuardianConfig memory guardianConfig = getGuardianConfig(account);

        return guardianConfig.acceptedWeight >= guardianConfig.threshold;
    }

    function isInited(address account) public view override returns (bool) {
        return inited[account];
    }

    /// @inheritdoc IERC165
    function supportsInterface(
        bytes4 interfaceId
    ) external pure override returns (bool) {
        return
            interfaceId == type(IModule).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }

    /**
     * @notice Recovers the ownership or control of the given account by setting a new owner or validator.
     * @dev
     * - This function is called as the final step of the recovery process once all recovery conditions
     *   have been met (such as threshold approval, delay passing, and no expiration).
     * - It interacts with the account's contract (IClaveAccount) to reset the owners or the validators using the provided newOwner data.
     * - The newOwner parameter is ABI encoded data which can represent a new account owner or any other recovery function as designed by the recovery module.
     * - This function should only be called internally as part of the recovery flow after validation in the completeRecovery function.
     * @param account The address of the account for which the recovery is being executed.
     * @param newOwner The new owner of the account
     */
    function recover(
        address account,
        bytes calldata newOwner
    ) internal override {
        IClaveAccount(account).resetOwners(newOwner);

        emit RecoveryExecuted(account, newOwner);
    }
}
