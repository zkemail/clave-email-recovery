// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { StringUtils } from "./libraries/stringUtils.sol";

contract TestStringUtils {
  function test(bytes calldata data) public pure returns (bytes memory result) {
      string memory key = abi.decode(
            data,
            (string)
      );
      result = StringUtils.hexToBytes(key);
  }
}