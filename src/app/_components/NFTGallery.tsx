"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
interface NFTGalleryProps {
  isConnected: boolean;
  walletAddress?: string; // 添加钱包地址属性
}

/**
 * NFT展示区组件
 * 展示用户铸造的NFT表情包
 */
export default function NFTGallery({ isConnected, walletAddress }: NFTGalleryProps) {
  // 添加NFT列表状态
  const [isLoading, setIsLoading] = useState(false);

  // 使用tRPC hooks获取NFT列表
  const { data: nfts, isLoading: isLoadingNFTs } = api.nft.getNFTsByOwner.useQuery(
    { ownerAddress: walletAddress || "" },
    { 
      enabled: isConnected && !!walletAddress,  // 只在钱包连接且地址存在时启用查询

    }
  );

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6">我铸造的NFT表情包</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isConnected ? (
          <>
            {/* 加载状态 */}
            {isLoadingNFTs ? (
              <div className="col-span-3 text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto"></div>
                <p className="mt-4 text-gray-400">正在加载NFT列表...</p>
              </div>
            ) : nfts && nfts.length > 0 ? (
              // 展示NFT列表
              <>
                {nfts.map((nft) => (
                  <div key={nft.tokenId} className="bg-white bg-opacity-10 rounded-xl p-4 hover:bg-opacity-20 transition-all cursor-pointer">
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
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm transition-all">
                          使用
                        </button>
                        <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full text-sm transition-all">
                          交易
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 铸造新NFT按钮卡片 */}
                <div className="bg-white bg-opacity-5 rounded-xl p-4 hover:bg-opacity-10 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[300px]">
                  <div className="text-6xl mb-4">+</div>
                  <button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-full text-lg transition-all">
                    铸造新表情包
                  </button>
                </div>
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