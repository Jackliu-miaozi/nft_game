"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { createWalletClient, custom, hashMessage, verifyMessage } from 'viem';
interface NFTGalleryProps {
  isConnected: boolean;
  walletAddress?: string;
  onSelectNFT?: (nft: {
    imageData: string;
    name: string;
    power: number;
  }) => void;
}

/**
 * NFT展示区组件
 * 展示用户铸造的NFT表情包
 */
export default function NFTGallery({ isConnected, walletAddress, onSelectNFT }: NFTGalleryProps) {
  const [isManageMode, setIsManageMode] = useState(false);

  const { data: nfts, isLoading: isLoadingNFTs } = api.nft.getNFTsByOwner.useQuery(
    { ownerAddress: walletAddress || "" },
    { 
      enabled: isConnected && !!walletAddress,
    }
  );

  // 获取utils用于刷新缓存
  const utils = api.useUtils();
  
  // 创建删除NFT的mutation
  const deleteNFTMutation = api.nft.deleteNFT.useMutation({
    onSuccess: () => {
      // 删除成功后刷新NFT列表
      void utils.nft.getNFTsByOwner.invalidate();
      alert('NFT删除成功！');
    },
    onError: (error) => {
      console.error('删除NFT失败:', error);
      alert(error.message || '删除NFT失败，请重试');
    }
  });

  /**
   * 生成删除NFT的签名消息
   * @param tokenId NFT的唯一标识
   * @returns 待签名的消息
   */
  const generateDeleteMessage = (tokenId: string) => {
    return `删除NFT确认\n\nToken ID: ${tokenId}\n钱包地址: ${walletAddress}\n时间戳: ${Date.now()}\n\n此操作不可撤销`;
  };

  /**
   * 处理删除NFT的函数
   * 需要用户先进行签名确认
   */
  const handleDeleteNFT = async (tokenId: string) => {
    if (!walletAddress) return;
    
    if (confirm('确定要删除这个NFT吗？')) {
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
        const message = generateDeleteMessage(tokenId);
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

        // 签名验证通过，执行删除操作
        await deleteNFTMutation.mutateAsync({
          tokenId,
          ownerAddress: walletAddress,
          signature,
          message,
          messageHash
        });

      } catch (error) {
        console.error('删除NFT失败:', error);
        alert(error instanceof Error ? error.message : '删除NFT失败，请重试');
      }
    }
  };

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">我铸造的NFT表情包</h2>
        <button 
          onClick={() => setIsManageMode(!isManageMode)}
          className={`text-sm underline hover:cursor-pointer ${isManageMode ? 'text-red-400' : ''}`}
        >
          {isManageMode ? '完成管理' : '管理我的表情包'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isConnected ? (
          <>
            {isLoadingNFTs ? (
              <div className="col-span-3 text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto"></div>
                <p className="mt-4 text-gray-400">正在加载NFT列表...</p>
              </div>
            ) : nfts && nfts.length > 0 ? (
              <>
                {nfts.map((nft) => (
                  <div key={nft.tokenId} className="bg-white bg-opacity-10 rounded-xl p-4 hover:bg-opacity-20 transition-all cursor-pointer relative group">
                    {isManageMode && (
                      <button 
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full 
                        flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteNFT(nft.tokenId);
                        }}
                      >
                        ×
                      </button>
                    )}
                    <div className="aspect-square rounded-lg overflow-hidden mb-4">
                      <img
                        src={nft.imageData}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold">{nft.name}</h3>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">稀有度: {nft.rarity}%</span>
                        <span className="text-yellow-400">战力: {nft.power}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <button 
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm transition-all"
                          onClick={(e) => {
                            e.stopPropagation(); // 阻止事件冒泡
                            onSelectNFT?.({
                              imageData: nft.imageData,
                              name: nft.name,
                              power: nft.power
                            });
                          }}
                        >
                          使用
                        </button>
                        <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full text-sm transition-all">
                          交易
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              // 没有NFT时显示提示
              <div className="col-span-3 text-center text-gray-400 py-12">
                您还没有铸造任何NFT表情包
              </div>
            )}
          </>
        ) : (
          <div className="col-span-3 text-center text-gray-400 py-12">
            请连接钱包以查看您的NFT表情包
          </div>
        )}
      </div>
    </section>
  );
}