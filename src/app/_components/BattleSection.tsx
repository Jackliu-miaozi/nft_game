"use client";

import { useState } from "react";

interface BattleSectionProps {
  isConnected: boolean;
  nft: {
    imageData: string;
    name: string;
    power: number;
  } | null;
  onSelectNFT: (nft: {
    imageData: string;
    name: string;
    power: number;
  } | null) => void;
}

/**
 * 对战区域组件
 * 展示对战入口和选中的NFT
 */
export default function BattleSection({ isConnected, nft, onSelectNFT }: BattleSectionProps) {
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
                  onClick={() => onSelectNFT(null)}
                >
                  取消选择
                </button>
              </div>
            )}
            <button 
              className={`bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all ${!nft ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!nft}
            >
              开始斗图对战
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-400">请先连接钱包以开始游戏</p>
        )}
      </div>
    </section>
  );
}