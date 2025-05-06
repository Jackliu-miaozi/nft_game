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
    
    /**
     * @dev 构造函数
     * @param initialSupply 初始供应量
     */
    constructor(uint256 initialSupply) ERC20("GameToken", "GTK") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
    
    /**
     * @dev 铸造新代币
     * @param to 接收者地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev 销毁代币
     * @param amount 销毁数量
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev 从指定地址销毁代币（需要授权）
     * @param from 销毁来源地址
     * @param amount 销毁数量
     */
    function burnFrom(address from, uint256 amount) external {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
    }
}
