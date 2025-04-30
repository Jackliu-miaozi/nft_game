"use client";
import type { MetaMaskInpageProvider } from '@metamask/providers';
import { useState, useEffect } from 'react';
import { createWalletClient, custom } from 'viem';
import Header from './_components/Header';
import NFTGallery from './_components/NFTGallery';
import BattleSection from './_components/BattleSection';

/**
 * NFT斗图游戏首页
 * 使用viem库实现钱包连接功能
 */
export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // 添加 useEffect 钩子来检查和恢复存储的钱包状态
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window !== 'undefined') {
        const storedAddress = localStorage.getItem('walletAddress');
        const storedConnected = localStorage.getItem('walletConnected');

        if (storedAddress && storedConnected === 'true') {
          // 验证钱包是否真的还在连接状态
          try {
            const provider = (window as any).ethereum as MetaMaskInpageProvider;
            const accounts = await provider.request({ 
              method: 'eth_accounts' 
            }) as string[];
            
            if (accounts && accounts[0] && accounts[0].toLowerCase() === storedAddress.toLowerCase()) {
              setWalletAddress(storedAddress);
              setIsConnected(true);
            } else {
              // 如果钱包已断开，清除本地存储
              localStorage.removeItem('walletAddress');
              localStorage.removeItem('walletConnected');
            }
          } catch (error) {
            console.error('检查钱包状态时出错:', error);
            // 发生错误时清除本地存储
            localStorage.removeItem('walletAddress');
            localStorage.removeItem('walletConnected');
          }
        }
      }
    };

    checkWalletConnection();
  }, []);

  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined') {
        // 将window.ethereum转换为MetaMaskInpageProvider类型
        const provider = (window as any).ethereum as MetaMaskInpageProvider;
        
        // 请求用户授权连接钱包
        await provider.request({ 
        method: 'eth_requestAccounts' 
        });

        const client = createWalletClient({
        transport: custom(provider)
        });

        const [address] = await client.getAddresses();

        if (!address) {
          throw new Error('未能获取钱包地址');
        }

        setWalletAddress(address);
        setIsConnected(true);
      
        // 保存连接状态到 localStorage
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('walletConnected', 'true');
      
      } else {
        alert('请安装MetaMask或其他Web3钱包扩展');
      }
    } catch (error) {
      // 根据错误类型显示不同的错误信息
      if ((error as any).code === 4001) {
        alert('用户拒绝了连接请求');
      } else if ((error as any).code === -32002) {
        alert('钱包连接请求正在处理中，请检查钱包');
      } else {
        console.error('连接钱包失败:', error);
        alert('连接钱包时发生错误，请稍后重试');
      }
    }
  };

  /**
   * 断开钱包连接
   * 清除本地状态并通知用户
   */
  const disconnectWallet = () => {
    // 清除本地状态
    setWalletAddress('');
    setIsConnected(false);
    
    // 存储断开状态到本地存储（可选）
    if (typeof window !== 'undefined') {
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
    }
    
    // 通知用户已断开连接
    console.log('钱包已断开连接');
    
    // 注意：大多数钱包（如MetaMask）没有提供直接断开连接的API
    // 我们只能在前端应用中清除连接状态
    
    // 显示断开连接提示（可选）
    alert('钱包已断开连接');
  };

  return (
    <div>
      <Header 
        isConnected={isConnected}
        walletAddress={walletAddress}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
      />

      <main className="container mx-auto py-8 px-4">
        <NFTGallery isConnected={isConnected} />
        <BattleSection isConnected={isConnected} />
      </main>
    </div>
  );
}