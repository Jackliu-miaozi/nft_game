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
    using Counters for Counters.Counter;
    
    // 用于生成唯一的tokenId
    Counters.Counter private _tokenIdCounter;
    
    struct EmojiData {
        string name;        // NFT名称
        string imageURI;    // 图片URI
        uint256 power;      // 战力值（由搞笑值决定）
        uint256 rarity;     // 稀有度
        uint256 createTime; // 创建时间
    }
    
    // 存储每个NFT的数据
    mapping(uint256 => EmojiData) private _emojiData;
    
    // 事件
    event EmojiCreated(uint256 indexed tokenId, address indexed owner, string name, uint256 power);
    event EmojiPowerUpdated(uint256 indexed tokenId, uint256 oldPower, uint256 newPower);
    
    /**
     * @dev 构造函数
     */
    constructor() ERC721("EmojiNFT", "EMOJI") Ownable(msg.sender) {
        // 初始化从1开始
        _tokenIdCounter.increment();
    }
    
    /**
     * @dev 创建新的NFT
     * @param to 接收者地址
     * @param name NFT名称
     * @param imageURI 图片URI
     * @param power 战力值
     * @param rarity 稀有度
     * @return tokenId 创建的NFT ID
     */
    function createEmoji(
        address to,
        string memory name,
        string memory imageURI,
        uint256 power,
        uint256 rarity
    ) external returns (uint256) {
        require(rarity <= 100, "Rarity must be between 0 and 100");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        
        _emojiData[tokenId] = EmojiData({
            name: name,
            imageURI: imageURI,
            power: power,
            rarity: rarity,
            createTime: block.timestamp
        });
        
        emit EmojiCreated(tokenId, to, name, power);
        
        return tokenId;
    }
    
    /**
     * @dev 获取NFT数据
     * @param tokenId NFT ID
     * @return 表情包数据
     */
    function getEmojiData(uint256 tokenId) external view returns (EmojiData memory) {
        require(_exists(tokenId), "NFT does not exist");
        return _emojiData[tokenId];
    }
    
    /**
     * @dev 更新NFT战力
     * @param tokenId NFT ID
     * @param newPower 新战力值
     */
    function updatePower(uint256 tokenId, uint256 newPower) external onlyOwner {
        require(_exists(tokenId), "NFT does not exist");
        
        uint256 oldPower = _emojiData[tokenId].power;
        _emojiData[tokenId].power = newPower;
        
        emit EmojiPowerUpdated(tokenId, oldPower, newPower);
    }
    
    /**
     * @dev 检查tokenId是否存在
     * @param tokenId NFT ID
     * @return 是否存在
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    /**
     * @dev 获取NFT的URI
     * @param tokenId NFT ID
     * @return URI字符串
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "NFT does not exist");
        return _emojiData[tokenId].imageURI;
    }
}