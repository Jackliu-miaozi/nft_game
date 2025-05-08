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
    const [form, setForm] = useState({
        image: null as File | null,
        name: '',
        description: ''
    });
    const [isUploading, setIsUploading] = useState(false);
    const utils = api.useUtils();

    const createNFTMutation = api.nft.createNFT.useMutation({
        onSuccess: () => {
            utils.nft.getNFTsByOwner.invalidate();
            setForm({ image: null, name: '', description: '' });
            setIsUploading(false);
            alert('NFT铸造成功！');
        },
        onError: (error) => {
            console.error('铸造NFT失败:', error);
            alert(error.message || '铸造NFT失败，请重试');
            setIsUploading(false);
        }
    });

    const handleInputChange = (field: keyof typeof form, value: string | File) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    /**
     * 处理钱包签名验证
     */
    const verifyWalletSignature = async (message: string) => {
        if (typeof window === 'undefined' || !(window as any).ethereum) {
            throw new Error('未检测到Web3钱包');
        }

        const client = createWalletClient({
            transport: custom((window as any).ethereum)
        });

        const messageHash = hashMessage(message);
        const signature = await client.signMessage({
            message,
            account: walletAddress as `0x${string}`
        });

        const isValid = await verifyMessage({
            message,
            signature,
            address: walletAddress as `0x${string}`
        });

        if (!isValid) throw new Error('签名验证失败');
        
        return { signature, messageHash };
    };

    const handleMint = async () => {
        if (!isConnected || !walletAddress) {
            alert('请先连接钱包');
            return;
        }
    
        if (!form.image || !form.name) {
            alert('请选择图片并输入NFT名称');
            return;
        }
    
        setIsUploading(true);
        try {
            const message = `铸造NFT确认\n\nNFT名称: ${form.name}\n钱包地址: ${walletAddress}\n时间戳: ${Date.now()}`;
            const { signature, messageHash } = await verifyWalletSignature(message);

            const base64Image = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(form.image!);
            });

            // 获取搞笑值，失败则使用随机值
            const funniness = await fetch('/api/funniness', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image })
            })
            .then(res => res.json())
            .then(data => typeof data.funniness === 'number' ? data.funniness : Math.floor(Math.random() * 100))
            .catch(() => Math.floor(Math.random() * 100));

            createNFTMutation.mutate({
                tokenId: `${Date.now()}`,
                ownerAddress: walletAddress,
                imageData: base64Image,
                name: form.name,
                description: form.description,
                rarity: Math.floor(Math.random() * 100),
                power: funniness,
                signature,
                message,
                messageHash
            });

        } catch (error) {
            console.error('铸造NFT失败:', error);
            alert(error instanceof Error ? error.message : '铸造NFT失败，请重试');
            setIsUploading(false);
        }
    };

    if (!isConnected) return null;

    return (
        <section className="mb-12 bg-gray-800 bg-opacity-90 rounded-xl p-6 shadow-lg border border-purple-500/20">
            <h2 className="text-2xl font-bold mb-6 text-purple-300">铸造新的表情包NFT</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2 text-purple-200">选择图片</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleInputChange('image', e.target.files[0])}
                        className="w-full bg-gray-700 text-gray-200 rounded-lg p-2 border border-purple-500/30 focus:border-purple-500 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-purple-200">NFT名称</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="给你的表情包起个名字"
                        className="w-full bg-gray-700 text-gray-200 rounded-lg p-2 border border-purple-500/30 focus:border-purple-500 focus:outline-none placeholder-gray-400"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-purple-200">描述（可选）</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="添加一些描述..."
                        className="w-full bg-gray-700 text-gray-200 rounded-lg p-2 h-24 border border-purple-500/30 focus:border-purple-500 focus:outline-none placeholder-gray-400"
                    />
                </div>

                <button
                    onClick={handleMint}
                    disabled={isUploading || !form.image || !form.name}
                    className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 
                    hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 
                    rounded-full text-lg transition-all shadow-lg hover:shadow-purple-500/20
                    ${(isUploading || !form.image || !form.name)
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