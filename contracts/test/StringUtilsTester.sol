// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {StringUtils} from "../libraries/StringUtils.sol";

contract StringUtilsTester {
    function testHexToBytes32(
        bytes calldata data
    ) public pure returns (bytes32 result) {
        string memory key = abi.decode(data, (string));

        result = StringUtils.hexToBytes32(key);
    }

    function testHexToBytes(
        bytes calldata data
    ) public pure returns (bytes memory result) {
        string memory key = abi.decode(data, (string));

        result = StringUtils.hexToBytes(key);
    }
}
