// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IModule} from "./interfaces/IModule.sol";
import {EmailAuth} from "@zk-email/ether-email-auth-contracts/src/EmailAuth.sol";
import {IEmailRecoveryModule} from "@zk-email/email-recovery/src/interfaces/IEmailRecoveryModule.sol";
import {IClaveAccount} from "./interfaces/IClave.sol";
import {Errors} from "./libraries/ClaveErrors.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {EmailRecoveryManagerZkSync} from "@zk-email/email-recovery/src/EmailRecoveryManagerZkSync.sol";
import {GuardianManager} from "@zk-email/email-recovery/src/GuardianManager.sol";
import {L2ContractHelper} from "@matterlabs/zksync-contracts/l2/contracts/L2ContractHelper.sol";
import {DEPLOYER_SYSTEM_CONTRACT, IContractDeployer} from "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";
import {SystemContractsCaller} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/SystemContractsCaller.sol";

contract EmailRecoveryModule is
    EmailRecoveryManagerZkSync,
    IModule,
    IEmailRecoveryModule
{
    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                    CONSTANTS & STORAGE                     */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

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

    constructor(
        address _verifier,
        address _dkimRegistry,
        address _emailAuthImpl,
        address _commandHandler,
        address _factoryAddr
    )
        EmailRecoveryManagerZkSync(
            _verifier,
            _dkimRegistry,
            _emailAuthImpl,
            _commandHandler,
            _factoryAddr
        )
    {}

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

    function disable() external override {
        inited[msg.sender] = false;

        deInitRecoveryModule();

        emit Disabled(msg.sender);
    }

    function isInited(address account) public view override returns (bool) {
        return inited[account];
    }

    function canStartRecoveryRequest(
        address account
    ) external view returns (bool) {
        GuardianConfig memory guardianConfig = getGuardianConfig(account);

        return guardianConfig.acceptedWeight >= guardianConfig.threshold;
    }

    function recover(
        address account,
        bytes calldata newOwner
    ) internal override {
        IClaveAccount(account).resetOwners(newOwner);

        emit RecoveryExecuted(account, newOwner);
    }

    /// @inheritdoc IERC165
    function supportsInterface(
        bytes4 interfaceId
    ) external pure override returns (bool) {
        return
            interfaceId == type(IModule).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }

    /// @notice Computes the address for email auth contract using the CREATE2 opcode.
    /// @dev This function utilizes the `ZKSyncCreate2Factory` to compute the address. The
    /// computation uses a provided account address to be recovered, account salt,
    /// and the hash of the encoded ERC1967Proxy creation code concatenated with the encoded email
    /// auth contract implementation
    /// address and the initialization call data. This ensures that the computed address is
    /// deterministic and unique per account salt.
    /// @param recoveredAccount The address of the account to be recovered.
    /// @param accountSalt A bytes32 salt value defined as a hash of the guardian's email address
    /// and an account code. This is assumed to be unique to a pair of the guardian's email address
    /// and the wallet address to be recovered.
    /// @return address The computed address.
    function computeEmailAuthAddress(
        address recoveredAccount,
        bytes32 accountSalt
    )
        public
        view
        virtual
        override(EmailRecoveryManagerZkSync)
        returns (address)
    {
        return
            L2ContractHelper.computeCreate2Address(
                address(this),
                accountSalt,
                bytes32(
                    0x01000079fe5d47bffb6ad03a28da66955df7842652c6be781d33bbcb757d1f5d
                ),
                keccak256(
                    abi.encode(
                        emailAuthImplementation(),
                        abi.encodeCall(
                            EmailAuth.initialize,
                            (recoveredAccount, accountSalt, address(this))
                        )
                    )
                )
            );
    }

    /// @notice Deploys a proxy contract for email authentication using the CREATE2 opcode.
    /// @dev This function utilizes the `ZKSyncCreate2Factory` to deploy the proxy contract. The
    /// deployment uses a provided account address to be recovered, account salt,
    /// and the hash of the encoded ERC1967Proxy creation code concatenated with the encoded email
    /// auth contract implementation
    /// address and the initialization call data. This ensures that the deployed address is
    /// deterministic and unique per account salt.
    /// @param recoveredAccount The address of the account to be recovered.
    /// @param accountSalt A bytes32 salt value defined as a hash of the guardian's email address
    /// and an account code. This is assumed to be unique to a pair of the guardian's email address
    /// and the wallet address to be recovered.
    /// @return address The address of the deployed proxy contract.
    function deployEmailAuthProxy(
        address recoveredAccount,
        bytes32 accountSalt
    ) internal virtual override(EmailRecoveryManagerZkSync) returns (address) {
        (bool success, bytes memory returnData) = SystemContractsCaller
            .systemCallWithReturndata(
                uint32(gasleft()),
                address(DEPLOYER_SYSTEM_CONTRACT),
                uint128(0),
                abi.encodeCall(
                    DEPLOYER_SYSTEM_CONTRACT.create2,
                    (
                        accountSalt,
                        0x01000079fe5d47bffb6ad03a28da66955df7842652c6be781d33bbcb757d1f5d,
                        abi.encode(
                            emailAuthImplementation(),
                            abi.encodeCall(
                                EmailAuth.initialize,
                                (recoveredAccount, accountSalt, address(this))
                            )
                        )
                    )
                )
            );
        require(success, "Failed to deploy email auth proxy contract");
        address payable proxyAddress = abi.decode(returnData, (address));

        return proxyAddress;
    }
}
