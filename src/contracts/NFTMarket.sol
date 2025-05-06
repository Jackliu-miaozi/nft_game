// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NFTEmoji.sol";
import "./GameToken.sol";

/**
 * @title NFTMarket
 * @dev NFT市场合约，处理NFT的交易
 */
contract NFTMarket {
    // NFT合约地址
    address public nftContract;
    // 游戏代币合约地址
    address public tokenContract;
    
    // 上架信息
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
    }
    
    // 存储所有上架信息
    mapping(uint256 => Listing) public listings;
    
    // 市场手续费率（百分比）
    uint256 public feePercentage = 2; // 2%
    
    // 事件
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event NFTListingCancelled(uint256 indexed tokenId, address indexed seller);
    event FeePercentageUpdated(uint256 oldFee, uint256 newFee);
    
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
     * @dev 上架NFT
     * @param tokenId NFT ID
     * @param price 价格（以游戏代币计）
     */
    function listNFT(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than zero");
        require(NFTEmoji(nftContract).ownerOf(tokenId) == msg.sender, "Not NFT owner");
        
        // 检查是否已授权给市场合约
        require(
            NFTEmoji(nftContract).getApproved(tokenId) == address(this) || 
            NFTEmoji(nftContract).isApprovedForAll(msg.sender, address(this)),
            "Market not approved"
        );
        
        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            isActive: true
        });
        
        emit NFTListed(tokenId, msg.sender, price);
    }
    
    /**
     * @dev 购买NFT
     * @param tokenId NFT ID
     */
    function buyNFT(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        
        require(listing.isActive, "NFT not listed for sale");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");
        
        // 计算手续费
        uint256 fee = (listing.price * feePercentage) / 100;
        uint256 sellerAmount = listing.price - fee;
        
        // 转移代币
        GameToken(tokenContract).transferFrom(msg.sender, listing.seller, sellerAmount);
        GameToken(tokenContract).transferFrom(msg.sender, address(this), fee);
        
        // 转移NFT
        NFTEmoji(nftContract).transferFrom(listing.seller, msg.sender, tokenId);
        
        // 更新上架状态
        listings[tokenId].isActive = false;
        
        emit NFTSold(tokenId, listing.seller, msg.sender, listing.price);
    }
    
    /**
     * @dev 取消上架
     * @param tokenId NFT ID
     */
    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        
        require(listing.isActive, "NFT not listed for sale");
        require(listing.seller == msg.sender, "Not the seller");
        
        listings[tokenId].isActive = false;
        
        emit NFTListingCancelled(tokenId, msg.sender);
    }
    
    /**
     * @dev 更新手续费率
     * @param newFeePercentage 新手续费率
     */
    function updateFeePercentage(uint256 newFeePercentage) external {
        require(msg.sender == NFTEmoji(nftContract).owner(), "Not NFT contract owner");
        require(newFeePercentage <= 10, "Fee too high");
        
        uint256 oldFee = feePercentage;
        feePercentage = newFeePercentage;
        
        emit FeePercentageUpdated(oldFee, newFeePercentage);
    }
    
    /**
     * @dev 提取合约中的代币
     * @param amount 提取数量
     */
    function withdrawTokens(uint256 amount) external {
        require(msg.sender == NFTEmoji(nftContract).owner(), "Not NFT contract owner");
        
        GameToken(tokenContract).transfer(msg.sender, amount);
    }
}