// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NFTEmoji.sol";

/**
 * @title BattleSystem
 * @dev 斗图对战系统合约
 */
contract BattleSystem {
    struct Battle {
        address player1;
        address player2;
        uint256 nftId1;
        uint256 nftId2;
        uint256 startTime;
        uint256 endTime;
        address winner;
    }
    // 添加事件
    event BattleStarted(
        uint256 battleId,
        address indexed player1,
        uint256 nftId1,
        uint256 timestamp
    );

    // 添加对战开始函数
    function startBattle(uint256 nftId) external {
        require(NFTEmoji(nftContract).ownerOf(nftId) == msg.sender, "Not NFT owner");
        
        uint256 battleId = battles.length;
        battles.push(Battle({
            player1: msg.sender,
            player2: address(0),
            nftId1: nftId,
            nftId2: 0,
            startTime: block.timestamp,
            endTime: 0,
            winner: address(0)
        }));
        
        emit BattleStarted(battleId, msg.sender, nftId, block.timestamp);
    }
}