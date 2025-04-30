"use client";

interface MarketSectionProps {
  isConnected: boolean;
  walletAddress?: string;
}

/**
 * NFT市场区域组件
 * 展示用户可出售的NFT和市场上的NFT
 */
export default function MarketSection({ isConnected, walletAddress }: MarketSectionProps) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">NFT市场</h2>
      <div className="bg-white bg-opacity-10 p-6 rounded-xl">
        {isConnected ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 我的出售列表 */}
              <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">我的出售</h3>
                <div className="text-center text-gray-400 py-8">
                  暂无出售中的NFT
                </div>
              </div>
              
              {/* 市场列表 */}
              <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">市场列表</h3>
                <div className="text-center text-gray-400 py-8">
                  暂无可购买的NFT
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-12">
            请先连接钱包以访问NFT市场
          </p>
        )}
      </div>
    </section>
  );
}