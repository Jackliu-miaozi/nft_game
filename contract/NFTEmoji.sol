// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title NFTEmoji
 * @dev 表情包NFT合约，实现基础的NFT功能
 */
contract NFTEmoji is ERC721, Ownable {
    struct EmojiData {
        string name;        // NFT名称
        string imageURI;    // 图片URI
        uint256 power;      // 战力值（由搞笑值决定）
        uint256 rarity;     // 稀有度
        uint256 createTime; // 创建时间
    }
}