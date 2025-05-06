// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NFTEmoji.sol";
import "./GameToken.sol";

/**
 * @title BattleSystem
 * @dev 斗图对战系统合约
 */
contract BattleSystem {
    // NFT合约地址
    address public nftContract;
    // 游戏代币合约地址
    address public tokenContract;
    
    // 对战记录
    struct Battle {
        address player1;
        address player2;
        uint256 nftId1;
        uint256 nftId2;
        uint256 startTime;
        uint256 endTime;
        address winner;
        uint256 rewardAmount;
    }
    
    // 存储所有对战
    Battle[] public battles;
    
    // 对战状态映射
    mapping(uint256 => bool) public battleActive;
    
    // 添加事件
    event BattleStarted(
        uint256 indexed battleId,
        address indexed player1,
        uint256 nftId1,
        uint256 timestamp
    );
    
    event BattleEnded(
        uint256 indexed battleId,
        address indexed winner,
        uint256 rewardAmount,
        uint256 timestamp
    );
    
    /**
     * @dev 构造函数
     * @param _nftContract NFT合约地址
     * @param _tokenContract 游戏代币合约地址
     */
    constructor(address _nftContract, address _tokenContract) {
        nftContract = _nftContract;
        tokenContract = _tokenContract;
    }
    
    /**
     * @dev 开始对战
     * @param nftId 玩家使用的NFT ID
     * @return battleId 创建的对战ID
     */
    function startBattle(uint256 nftId) external returns (uint256) {
        // 验证调用者是否拥有该NFT
        require(NFTEmoji(nftContract).ownerOf(nftId) == msg.sender, "Not NFT owner");
        
        // 创建新对战
        uint256 battleId = battles.length;
        battles.push(Battle({
            player1: msg.sender,
            player2: address(0),
            nftId1: nftId,
            nftId2: 0,
            startTime: block.timestamp,
            endTime: 0,
            winner: address(0),
            rewardAmount: 0
        }));
        
        // 标记对战为活跃状态
        battleActive[battleId] = true;
        
        // 触发事件
        emit BattleStarted(battleId, msg.sender, nftId, block.timestamp);
        
        return battleId;
    }
    
    /**
     * @dev 加入对战
     * @param battleId 要加入的对战ID
     * @param nftId 玩家使用的NFT ID
     */
    function joinBattle(uint256 battleId, uint256 nftId) external {
        // 验证对战存在且活跃
        require(battleId < battles.length, "Battle does not exist");
        require(battleActive[battleId], "Battle not active");
        
        // 验证调用者是否拥有该NFT
        require(NFTEmoji(nftContract).ownerOf(nftId) == msg.sender, "Not NFT owner");
        
        // 获取对战
        Battle storage battle = battles[battleId];
        
        // 验证对战是否可加入
        require(battle.player2 == address(0), "Battle already full");
        require(battle.player1 != msg.sender, "Cannot battle yourself");
        
        // 更新对战信息
        battle.player2 = msg.sender;
        battle.nftId2 = nftId;
        
        // 自动结算对战结果
        _settleBattle(battleId);
    }
    
    /**
     * @dev 内部函数：结算对战
     * @param battleId 对战ID
     */
    function _settleBattle(uint256 battleId) internal {
        Battle storage battle = battles[battleId];
        
        // 获取两个NFT的战力
        uint256 power1 = NFTEmoji(nftContract).getEmojiData(battle.nftId1).power;
        uint256 power2 = NFTEmoji(nftContract).getEmojiData(battle.nftId2).power;
        
        // 确定获胜者
        address winner;
        if (power1 > power2) {
            winner = battle.player1;
        } else if (power2 > power1) {
            winner = battle.player2;
        } else {
            // 平局情况下随机选择获胜者
            winner = block.timestamp % 2 == 0 ? battle.player1 : battle.player2;
        }
        
        // 计算奖励金额（基于战力和随机因素）
        uint256 rewardAmount = (power1 + power2) * 10;
        
        // 更新对战信息
        battle.winner = winner;
        battle.endTime = block.timestamp;
        battle.rewardAmount = rewardAmount;
        battleActive[battleId] = false;
        
        // 发放奖励代币
        GameToken(tokenContract).mint(winner, rewardAmount);
        
        // 触发事件
        emit BattleEnded(battleId, winner, rewardAmount, block.timestamp);
    }
    
    /**
     * @dev 获取对战信息
     * @param battleId 对战ID
     * @return 对战详情
     */
    function getBattle(uint256 battleId) external view returns (Battle memory) {
        require(battleId < battles.length, "Battle does not exist");
        return battles[battleId];
    }
    
    /**
     * @dev 获取用户参与的所有对战
     * @param user 用户地址
     * @return 对战ID数组
     */
    function getUserBattles(address user) external view returns (uint256[] memory) {
        // 计算用户参与的对战数量
        uint256 count = 0;
        for (uint256 i = 0; i < battles.length; i++) {
            if (battles[i].player1 == user || battles[i].player2 == user) {
                count++;
            }
        }
        
        // 创建结果数组
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        
        // 填充结果
        for (uint256 i = 0; i < battles.length; i++) {
            if (battles[i].player1 == user || battles[i].player2 == user) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }
}