"use client";

interface HeaderProps {
  isConnected: boolean;
  walletAddress: string;
  onConnect: () => void;  // 连接钱包函数，现在是同步的，只显示钱包选择框
  onDisconnect: () => void;
  selectedWallet?: string; // 选中的钱包类型
}

/**
 * 页面头部组件
 * 包含标题和钱包连接功能
 */
export default function Header({ 
  isConnected, 
  walletAddress, 
  onConnect, 
  onDisconnect,
  selectedWallet 
}: HeaderProps) {
  return (
    <header className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold text-center mb-2">NFT斗图游戏</h1>
      <p className="text-xl text-center mb-8">铸造、交易并使用你的NFT表情包进行对战，获得Gamer代币奖励</p>
      
      <div className="flex justify-center">
        {!isConnected ? (
          <button 
            onClick={onConnect}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-full text-lg transition-all"
          >
            连接钱包
          </button>
        ) : (
          <div className="flex items-center space-x-4">
            <span className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center">
              {selectedWallet && (
                <span className="mr-2 text-sm">{selectedWallet}</span>
              )}
              {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
            </span>
            <button 
              onClick={onDisconnect}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full transition-all"
            >
              断开连接
            </button>
          </div>
        )}
      </div>
    </header>
  );
}