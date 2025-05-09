// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// 导入OpenZeppelin的ERC721标准合约
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// 导入可销毁扩展
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
// 导入所有权管理模块
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title NFTEmoji - 标准ERC721 NFT合约（无自定义扩展）
/// @author Jack
/// @notice 支持NFT的铸造、销毁和所有权管理
contract NFTEmoji is ERC721, ERC721Burnable, Ownable(msg.sender) {
    uint256 private _tokenIdCounter;

    /// @dev 构造函数，初始化合约名称和符号
    constructor() ERC721("NFTEmoji", "EMOJI") {}

    /// @notice 铸造NFT，仅限合约拥有者
    /// @param to 接收者地址
    function mint(address to) public onlyOwner {
        require(to != address(0), "NFT: mint to zero address");
        _tokenIdCounter += 1;
        _mint(to, _tokenIdCounter);
    }
}