// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title NFTEmoji - 一个简单的 ERC721 NFT 合约（不依赖合约库）
/// @author Jack
/// @notice 支持 NFT 的铸造、转移、元数据存储

contract NFTEmoji {
    // NFT 结构体，包含自定义元数据
    struct NFTMeta {
        string name;
        string tokenURI;
        uint256 power;
        uint256 rarity;
    }

    // tokenId 到拥有者的映射
    mapping(uint256 => address) private _owners;
    // 拥有者到 NFT 数量的映射
    mapping(address => uint256) private _balances;
    // tokenId 到授权地址的映射
    mapping(uint256 => address) private _tokenApprovals;
    // tokenId 到元数据的映射
    mapping(uint256 => NFTMeta) private _tokenMetas;

    // 总供应量
    uint256 private _totalSupply;

    // 事件定义
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    /// @notice 查询 NFT 拥有者
    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "NFT: owner query for nonexistent token");
        return owner;
    }

    /// @notice 查询拥有者 NFT 数量
    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "NFT: balance query for zero address");
        return _balances[owner];
    }

    /// @notice 查询 NFT 元数据
    function tokenMeta(uint256 tokenId) public view returns (NFTMeta memory) {
        require(_owners[tokenId] != address(0), "NFT: meta query for nonexistent token");
        return _tokenMetas[tokenId];
    }

    /// @notice 铸造 NFT，只有合约部署者可调用
    function mint(
        address to,
        string memory name,
        string memory tokenURI,
        uint256 power,
        uint256 rarity
    ) public returns (uint256) {
        require(to != address(0), "NFT: mint to zero address");
        uint256 tokenId = ++_totalSupply;
        require(_owners[tokenId] == address(0), "NFT: token already minted");

        _owners[tokenId] = to;
        _balances[to] += 1;
        _tokenMetas[tokenId] = NFTMeta(name, tokenURI, power, rarity);

        emit Transfer(address(0), to, tokenId);
        return tokenId;
    }

    /// @notice 转移 NFT
    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "NFT: not owner nor approved");
        require(ownerOf(tokenId) == from, "NFT: transfer from incorrect owner");
        require(to != address(0), "NFT: transfer to zero address");

        _approve(address(0), tokenId);

        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    /// @notice 授权 NFT
    function approve(address to, uint256 tokenId) public {
        address owner = ownerOf(tokenId);
        require(to != owner, "NFT: approval to current owner");
        require(msg.sender == owner, "NFT: approve caller is not owner");

        _approve(to, tokenId);
    }

    /// @notice 查询授权地址
    function getApproved(uint256 tokenId) public view returns (address) {
        require(_owners[tokenId] != address(0), "NFT: approved query for nonexistent token");
        return _tokenApprovals[tokenId];
    }

    /// @dev 内部授权函数
    function _approve(address to, uint256 tokenId) internal {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }

    /// @dev 判断是否为 owner 或授权地址
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || getApproved(tokenId) == spender);
    }

    // 新增事件：销毁NFT
    event Burn(address indexed owner, uint256 indexed tokenId);

    /// @notice 销毁NFT，仅限NFT拥有者调用
    /// @param tokenId 要销毁的NFT的tokenId
    function burn(uint256 tokenId) public {
        address owner = ownerOf(tokenId);
        require(msg.sender == owner, "NFT: only owner can burn");

        // 清除授权
        _approve(address(0), tokenId);

        // 更新余额和拥有者映射
        _balances[owner] -= 1;
        delete _owners[tokenId];
        delete _tokenMetas[tokenId];

        emit Burn(owner, tokenId);
        emit Transfer(owner, address(0), tokenId);
    }
}