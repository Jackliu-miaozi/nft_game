"use client";

import Header from './_components/Header';
import NFTGallery from './_components/NFTGallery';
import BattleSection from './_components/BattleSection';
import MintSection from './_components/MintSection';
import MarketSection from './_components/MarketSection';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useState } from 'react';

/**
 * NFT斗图游戏首页
 * 使用自定义Hook管理钱包连接功能
 */
export default function Home() {
  const { 
    isConnected, 
    walletAddress, 
    connectWallet, 
    disconnectWallet,
    selectedWallet,
    showWalletModal,
    setShowWalletModal,
    connectSpecificWallet,
    supportedWallets
  } = useWalletConnection();

  const [selectedNFT, setSelectedNFT] = useState<{
    imageData: string;
    name: string;
    power: number;
  } | null>(null);

  return (
    <div>
      <Header
        isConnected={isConnected}
        walletAddress={walletAddress}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        selectedWallet={selectedWallet}
      />
      
      {/* 钱包选择模态框 */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">选择钱包</h3>
            <div className="space-y-3">
              {supportedWallets.map(wallet => (
                <button
                  key={wallet.name}
                  onClick={() => connectSpecificWallet(wallet.name)}
                  className="flex items-center space-x-3 w-full bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors"
                >
                  <img src={wallet.icon} alt={wallet.name} className="w-8 h-8" />
                  <span>{wallet.name}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowWalletModal(false)}
              className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
            >
              取消
            </button>
          </div>
        </div>
      )}
      
      <main className="container mx-auto py-8 px-4">
        <MintSection isConnected={isConnected} walletAddress={walletAddress} />
        <NFTGallery 
          isConnected={isConnected} 
          walletAddress={walletAddress}
          onSelectNFT={setSelectedNFT}
        />
        <BattleSection 
          isConnected={isConnected}
          nft={selectedNFT}
          onSelectNFT={setSelectedNFT}
        />
        <MarketSection 
          isConnected={isConnected}
          walletAddress={walletAddress}
        />
      </main>
    </div>
  );
}