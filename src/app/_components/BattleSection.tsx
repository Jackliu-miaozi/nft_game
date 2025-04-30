"use client";

interface BattleSectionProps {
  isConnected: boolean;
}

/**
 * 对战区域组件
 * 展示对战入口
 */
export default function BattleSection({ isConnected }: BattleSectionProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">开始对战</h2>
      <div className="bg-white bg-opacity-10 p-6 rounded-xl">
        {isConnected ? (
          <button className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all">
            开始斗图对战
          </button>
        ) : (
          <p className="text-center text-black">请先连接钱包以开始游戏</p>
        )}
      </div>
    </section>
  );
}