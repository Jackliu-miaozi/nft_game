// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NFTEmoji.sol";
import "./GameToken.sol";

/**
 * @title NFTMarket
 * @dev NFT市场合约，处理NFT的交易
 */
contract NFTMarket {
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
    }
}