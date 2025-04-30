"use client";

import { useState } from 'react';
import { api } from "@/trpc/react";
import { createWalletClient, custom, hashMessage, verifyMessage } from 'viem';

interface MintSectionProps {
    isConnected: boolean;
    walletAddress?: string;
}

/**
 * NFT铸造区域组件
 * 处理表情包NFT的铸造功能
 */
export default function MintSection({ isConnected, walletAddress }: MintSectionProps) {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [nftName, setNftName] = useState('');
    const [description, setDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // 获取 trpc utils 用于缓存操作
    const utils = api.useUtils();
    const createNFTMutation = api.nft.createNFT.useMutation({
        // 铸造成功后的回调
        onSuccess: () => {
            // 使 NFT 相关的查询缓存失效
            utils.nft.getNFTsByOwner.invalidate();
            // 重置表单
            setSelectedImage(null);
            setNftName('');
            setDescription('');
            setIsUploading(false); // 添加这行，重置上传状态
            alert('NFT铸造成功！');
        },
        // 添加错误处理回调
        onError: (error) => {
            console.error('铸造NFT失败:', error);
            alert('铸造NFT失败，请重试');
            setIsUploading(false);
        }
    });

    /**
     * 处理图片选择
     * @param event 文件选择事件
     */
    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
        } else {
            alert('请选择有效的图片文件');
        }
    };

    /**
     * 生成铸造NFT的签名消息
     * @param name NFT名称
     * @returns 待签名的消息
     */
    const generateMintMessage = (name: string) => {
        return `铸造NFT确认\n\nNFT名称: ${name}\n钱包地址: ${walletAddress}\n时间戳: ${Date.now()}\n\n此操作将创建一个新的NFT`;
    };

    /**
     * 处理NFT铸造
     * 将图片和元数据上传并创建NFT
     */
    const handleMint = async () => {
        if (!isConnected || !walletAddress) {
            alert('请先连接钱包');
            return;
        }
    
        if (!selectedImage || !nftName) {
            alert('请选择图片并输入NFT名称');
            return;
        }
    
        setIsUploading(true);
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
            const message = generateMintMessage(nftName);
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
    
            // 签名验证通过，继续铸造流程
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Image = reader.result as string;
    
                // 1. 调用大模型API获取搞笑值
                let funniness = 0;
                try {
                    const response = await fetch('/api/funniness', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            image: base64Image,
                        })
                    });
                    const data = await response.json();
                    funniness = typeof data.funniness === 'number' ? data.funniness : Math.floor(Math.random() * 100);
                } catch (e) {
                    // 如果大模型API失败，降级为随机值
                    funniness = Math.floor(Math.random() * 100);
                }
    
                const rarity = Math.floor(Math.random() * 100);
                // 2. 用搞笑值作为power或单独字段
                createNFTMutation.mutate({
                    tokenId: `${Date.now()}`,
                    ownerAddress: walletAddress,
                    imageData: base64Image,
                    name: nftName,
                    description: description,
                    rarity: rarity,
                    power: funniness, // 用搞笑值作为power
                    signature,        // 添加签名
                    message,         // 添加消息
                    messageHash      // 添加消息哈希
                });
            };
            reader.readAsDataURL(selectedImage);
        } catch (error) {
            console.error('铸造NFT失败:', error);
            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert('铸造NFT失败，请重试');
            }
            setIsUploading(false);
        }
    };

    if (!isConnected) {
        return null; // 未连接钱包时不显示铸造区域
    }

    return (
        <section className="mb-12 bg-gray-800 bg-opacity-90 rounded-xl p-6 shadow-lg border border-purple-500/20">
            <h2 className="text-2xl font-bold mb-6 text-purple-300">铸造新的表情包NFT</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2 text-purple-200">选择图片</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="w-full bg-gray-700 text-gray-200 rounded-lg p-2 border border-purple-500/30 focus:border-purple-500 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-purple-200">NFT名称</label>
                    <input
                        type="text"
                        value={nftName}
                        onChange={(e) => setNftName(e.target.value)}
                        placeholder="给你的表情包起个名字"
                        className="w-full bg-gray-700 text-gray-200 rounded-lg p-2 border border-purple-500/30 focus:border-purple-500 focus:outline-none placeholder-gray-400"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-purple-200">描述（可选）</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="添加一些描述..."
                        className="w-full bg-gray-700 text-gray-200 rounded-lg p-2 h-24 border border-purple-500/30 focus:border-purple-500 focus:outline-none placeholder-gray-400"
                    />
                </div>

                <button
                    onClick={handleMint}
                    disabled={isUploading || !selectedImage || !nftName}
                    className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 
                    hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 
                    rounded-full text-lg transition-all shadow-lg hover:shadow-purple-500/20
                    ${(isUploading || !selectedImage || !nftName)
                            ? 'opacity-50 cursor-not-allowed from-gray-600 to-gray-700'
                            : 'hover:scale-[1.02] transform'
                        }`}
                >
                    {isUploading ? '铸造中...' : '开始铸造'}
                </button>
            </div>
        </section>
    );
}