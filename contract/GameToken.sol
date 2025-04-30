// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GameToken
 * @dev 游戏代币合约，用于奖励和交易
 */
contract GameToken is ERC20, Ownable {
    // 代币用于：
    // 1. 对战奖励
    // 2. 市场交易
    // 3. 特殊功能解锁
}