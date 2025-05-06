"use client";

import { useState } from "react";
import { createWalletClient, custom, hashMessage, verifyMessage } from 'viem';
import { api } from "@/trpc/react";

interface BattleSectionProps {
  isConnected: boolean;
  nft: {
    imageData: string;
    name: string;
    power: number;
    tokenId: string; // 添加tokenId字段，用于智能合约交互
  } | null;
  onSelectNFT: (nft: {
    imageData: string;
    name: string;
    power: number;
    tokenId: string;
  } | null) => void;
  walletAddress?: string; // 添加钱包地址
}

/**
 * 对战区域组件
 * 展示对战入口和选中的NFT，处理与智能合约的交互
 */
export default function BattleSection({ isConnected, nft, onSelectNFT, walletAddress }: BattleSectionProps) {
  const [isBattleStarting, setIsBattleStarting] = useState(false);
  const [battleResult, setBattleResult] = useState<{
    status: 'success' | 'error';
    message: string;
    txHash?: string;
  } | null>(null);

  // 获取utils用于刷新缓存
  const utils = api.useUtils();
  
  // 创建开始对战的mutation
  const startBattleMutation = api.battle.startBattle.useMutation({
    onSuccess: (data) => {
      // 对战开始成功后的处理
      setBattleResult({
        status: 'success',
        message: '对战已开始！交易哈希: ' + data.txHash,
        txHash: data.txHash
      });
      setIsBattleStarting(false);
    },
    onError: (error) => {
      console.error('开始对战失败:', error);
      setBattleResult({
        status: 'error',
        message: error.message || '开始对战失败，请重试'
      });
      setIsBattleStarting(false);
    }
  });

  /**
   * 生成对战签名消息
   * @param tokenId NFT的唯一标识
   * @returns 待签名的消息
   */
  const generateBattleMessage = (tokenId: string) => {
    return `开始斗图对战确认\n\nToken ID: ${tokenId}\n钱包地址: ${walletAddress}\n时间戳: ${Date.now()}\n\n此操作将在链上发起一场对战`;
  };

  /**
   * 处理开始对战
   * 与智能合约交互，发起对战
   */
  const handleStartBattle = async () => {
    if (!isConnected || !walletAddress || !nft || !nft.tokenId) {
      alert('请先连接钱包并选择NFT');
      return;
    }
  
    // 验证NFT所有权
    // 获取该钱包地址拥有的所有NFT列表
    const userNfts = await utils.nft.getNFTsByOwner.fetch({
      ownerAddress: walletAddress 
    });
    
    // 检查选中的NFT是否属于当前钱包地址
    const isOwner = userNfts?.some(userNft => userNft.tokenId === nft.tokenId);
    
    if (!isOwner) {
      alert('您不是此NFT的所有者，无法使用它进行对战');
      return;
    }

    setIsBattleStarting(true);
    setBattleResult(null);
    
    try {
      // 检查是否存在以太坊提供者
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('未检测到Web3钱包');
      }

      // 创建钱包客户端
      const client = createWalletClient({
        transport: custom((window as any).ethereum)
      });

      // 生成待签名消息
      const message = generateBattleMessage(nft.tokenId);
      const messageHash = hashMessage(message);

      // 请求用户签名
      const signature = await client.signMessage({
        message,
        account: walletAddress as `0x${string}`
      });

      // 验证签名
      const isValid = await verifyMessage({
        message,
        signature,
        address: walletAddress as `0x${string}`
      });

      if (!isValid) {
        throw new Error('签名验证失败');
      }

      // 签名验证通过，调用智能合约
      startBattleMutation.mutate({
        tokenId: nft.tokenId,
        ownerAddress: walletAddress,
        signature,
        message,
        messageHash
      });

    } catch (error) {
      console.error('开始对战失败:', error);
      if (error instanceof Error) {
        setBattleResult({
          status: 'error',
          message: error.message
        });
      } else {
        setBattleResult({
          status: 'error',
          message: '开始对战失败，请重试'
        });
      }
      setIsBattleStarting(false);
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">开始对战</h2>
      <div className="bg-white bg-opacity-10 p-6 rounded-xl">
        {isConnected ? (
          <div className="space-y-6">
            {nft && (
              <div className="flex items-center space-x-4 mb-4 bg-white bg-opacity-20 p-4 rounded-lg">
                <div className="w-20 h-20 rounded-lg overflow-hidden">
                  <img
                    src={nft.imageData}
                    alt={nft.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold">{nft.name}</h3>
                  <p className="text-yellow-400">战力: {nft.power}</p>
                </div>
                <button 
                  className="ml-auto bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-sm"
                  onClick={() => {
                    onSelectNFT(null);
                    setBattleResult(null); // 清除对战结果
                  }}
                >
                  取消选择
                </button>
              </div>
            )}
            
            {/* 对战结果显示 */}
            {battleResult && (
              <div className={`p-4 rounded-lg ${battleResult.status === 'success' ? 'bg-green-500 bg-opacity-20' : 'bg-red-500 bg-opacity-20'}`}>
                <p>{battleResult.message}</p>
                {battleResult.txHash && (
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${battleResult.txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    在区块浏览器中查看
                  </a>
                )}
              </div>
            )}
            
            <button 
              className={`bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all 
                ${(!nft || isBattleStarting) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!nft || isBattleStarting}
              onClick={handleStartBattle}
            >
              {isBattleStarting ? '对战开始中...' : '开始斗图对战'}
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-400">请先连接钱包以开始游戏</p>
        )}
      </div>
    </section>
  );
}