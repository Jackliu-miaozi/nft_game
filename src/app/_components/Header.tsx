"use client";

import { useState, useEffect } from 'react';

interface HeaderProps {
  isConnected: boolean;
  walletAddress: string;
  onConnect: () => void;  // 连接钱包函数，现在是同步的，只显示钱包选择框
  onDisconnect: () => void;
  selectedWallet?: string; // 选中的钱包类型
  getAccounts?: () => Promise<string[]>; // 获取所有账户的方法
  switchAccount?: (address: string) => Promise<void>; // 切换账户的方法
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
  selectedWallet,
  getAccounts,
  switchAccount
}: HeaderProps) {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 获取账户列表
  const fetchAccounts = async () => {
    if (!getAccounts) return;
    setIsLoading(true);
    try {
      const accountList = await getAccounts();
      setAccounts(accountList);
    } catch (error) {
      console.error('获取账户列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 打开账户切换模态框
  const handleAccountSwitch = async () => {
    setShowAccountModal(true);
    await fetchAccounts();
  };

  // 切换到选择的账户
  const handleSelectAccount = async (address: string) => {
    if (!switchAccount) return;
    try {
      await switchAccount(address);
      setShowAccountModal(false);
    } catch (error) {
      console.error('切换账户失败:', error);
    }
  };

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
            <div className="relative">
              <button
                onClick={handleAccountSwitch}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full flex items-center transition-all"
              >
                {selectedWallet && (
                  <span className="mr-2 text-sm">{selectedWallet}</span>
                )}
                {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
              </button>

              {/* 账户切换模态框 */}
              {showAccountModal && (
                <div className="absolute top-full mt-2 w-72 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">选择账户</h3>
                    {isLoading ? (
                      <div className="text-center py-4 text-gray-400">加载中...</div>
                    ) : accounts.length === 0 ? (
                      <div className="text-center py-4 text-gray-400">没有可用账户</div>
                    ) : (
                      <div className="space-y-2">
                        {accounts.map((account) => (
                          <button
                            key={account}
                            onClick={() => handleSelectAccount(account)}
                            className={`w-full text-left px-4 py-2 rounded transition-colors ${account.toLowerCase() === walletAddress.toLowerCase() ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                          >
                            {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                            {account.toLowerCase() === walletAddress.toLowerCase() && (
                              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">当前账户</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setShowAccountModal(false)}
                        className="text-gray-400 hover:text-white text-sm"
                      >
                        关闭
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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