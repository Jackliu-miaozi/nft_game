"use client";

import { useState } from "react";

interface BattleSectionProps {
	isConnected: boolean;
	nft: {
		imageData: string;
		name: string;
		power: number;
	} | null;
	onSelectNFT: (
		nft: {
			imageData: string;
			name: string;
			power: number;
		} | null,
	) => void;
}

/**
 * 对战区域组件
 * 展示对战入口和选中的NFT
 */
export default function BattleSection({
	isConnected,
	nft,
	onSelectNFT,
}: BattleSectionProps) {
	return (
		<section>
			<h2 className="mb-6 font-bold text-2xl">开始对战</h2>
			<div className="rounded-xl bg-white bg-opacity-10 p-6">
				{isConnected ? (
					<div className="space-y-6">
						{nft && (
							<div className="mb-4 flex items-center space-x-4 rounded-lg bg-white bg-opacity-20 p-4">
								<div className="h-20 w-20 overflow-hidden rounded-lg">
									<img
										src={nft.imageData}
										alt={nft.name}
										className="h-full w-full object-cover"
									/>
								</div>
								<div>
									<h3 className="font-bold">{nft.name}</h3>
									<p className="text-yellow-400">战力: {nft.power}</p>
								</div>
								<button
									className="ml-auto rounded-full bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
									onClick={() => onSelectNFT(null)}
								>
									取消选择
								</button>
							</div>
						)}
						<button
							className={`rounded-full bg-pink-500 px-8 py-3 font-bold text-lg text-white transition-all hover:bg-pink-600 ${!nft ? "cursor-not-allowed opacity-50" : ""}`}
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
