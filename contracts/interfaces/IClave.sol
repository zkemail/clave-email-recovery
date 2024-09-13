// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.17;

/**
 * @title IClave
 * @notice Interface for the Clave contract
 * @dev Implementations of this interface are contract that can be used as a Clave
 */
interface IClaveAccount {
    /**
     * @notice Check if an address is in the list of modules
     * @param addr address - Address to check
     * @return bool - True if the address is a module, false otherwise
     */
    function isModule(address addr) external view returns (bool);

    /**
     * @notice Clears both r1 owners and k1 owners and adds an r1 owner
     * @dev Can only be called by self or a whitelisted module
     * @dev Public Key length must be 64 bytes
     * @param pubKey bytes calldata - new r1 owner to add
     */
    function resetOwners(bytes calldata pubKey) external;
}
