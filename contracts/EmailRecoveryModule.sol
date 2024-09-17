// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IModule} from "./interfaces/IModule.sol";
import {IEmailRecoveryModule} from "@zk-email/email-recovery/src/interfaces/IEmailRecoveryModule.sol";
import {EmailAuth} from "@zk-email/ether-email-auth-contracts/src/EmailAuth.sol";
import {IClaveAccount} from "./interfaces/IClave.sol";
import {Errors} from "./libraries/ClaveErrors.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {EmailRecoveryManagerZkSync} from "@zk-email/email-recovery/src/EmailRecoveryManagerZkSync.sol";
import {GuardianManager} from "@zk-email/email-recovery/src/GuardianManager.sol";
import {L2ContractHelper} from '@matterlabs/zksync-contracts/l2/contracts/L2ContractHelper.sol';
import {DEPLOYER_SYSTEM_CONTRACT, IContractDeployer} from '@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol';
import {SystemContractsCaller} from '@matterlabs/zksync-contracts/l2/system-contracts/libraries/SystemContractsCaller.sol';

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

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                       TEST PURPOSE                         */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    function computeEmailAuthAddressTest(
        address recoveredAccount,
        bytes32 accountSalt
    ) public view returns (address) {
        return
                L2ContractHelper.computeCreate2Address(
                    address(this),
                    accountSalt,
                    bytes32(0x01000077dbf74e76183846364176d6a61c2630e371b4acea4c856d76bf919bc9),
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

    function deployEmailAuthProxyTest(
        address recoveredAccount,
        bytes32 accountSalt
    ) public returns (address) {
        (bool success, bytes memory returnData) = SystemContractsCaller
            .systemCallWithReturndata(
                uint32(gasleft()),
                address(DEPLOYER_SYSTEM_CONTRACT),
            uint128(0),
            abi.encodeCall(
                DEPLOYER_SYSTEM_CONTRACT.create2,
                (
                    accountSalt,
                    0x01000077dbf74e76183846364176d6a61c2630e371b4acea4c856d76bf919bc9,
                    abi.encode(
                                emailAuthImplementation(),
                                abi.encodeCall(
                                    EmailAuth.initialize,
                                    (
                                        recoveredAccount,
                                        accountSalt,
                                        address(this)
                                    )
                                )
                    )
                )
            )
        );
        //! require(success, "Failed to deploy email auth proxy");
        address payable proxyAddress = abi.decode(returnData, (address));
        return proxyAddress;
    }

    function test(
        address recoveredAccount,
        bytes32 accountSalt
    ) public returns (bool) {
        address guardian = computeEmailAuthAddressTest(recoveredAccount, accountSalt);
        address deployed = deployEmailAuthProxyTest(recoveredAccount, accountSalt);

        return guardian == deployed;
    }
}
