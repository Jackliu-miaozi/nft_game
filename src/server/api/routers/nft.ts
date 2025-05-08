import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { nftImages } from "../../db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { mintNFT } from "@/lib/nft";

/**
 * NFT相关的tRPC路由
 * 处理NFT图片的读写操作
 */
export const nftRouter = createTRPCRouter({
	/**
	 * 获取指定钱包地址拥有的所有NFT
	 */
	getNFTsByOwner: publicProcedure
		.input(z.object({
			ownerAddress: z.string(),
		}))
		.query(async ({ ctx, input }) => {
			try {
				const userNFTs = await ctx.db
					.select()
					.from(nftImages)
					.where(eq(nftImages.ownerAddress, input.ownerAddress));

				return userNFTs;
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "获取NFT列表失败",
					cause: error,
				});
			}
		}),

	/**
	 * 获取单个NFT的详细信息
	 */
	getNFTById: publicProcedure
		.input(z.object({
			tokenId: z.string(),
		}))
		.query(async ({ ctx, input }) => {
			try {
				const nft = await ctx.db
					.select()
					.from(nftImages)
					.where(eq(nftImages.tokenId, input.tokenId))
					.limit(1);

				if (!nft.length) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "NFT不存在",
					});
				}

				return nft[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "获取NFT详情失败",
					cause: error,
				});
			}
		}),

	/**
	 * 创建新的NFT
	 */
	createNFT: publicProcedure
		.input(z.object({
			tokenId: z.string(),
			ownerAddress: z.string(),
			imageData: z.string(),
			name: z.string(),
			description: z.string().optional(),
			rarity: z.number().min(0).max(100),
			power: z.number().min(0),
			signature: z.string(),
			message: z.string(),
			messageHash: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			try {
				// 1. 先在链上铸造NFT
				const tokenId= await mintNFT(
					`0x${input.ownerAddress.replace('0x', '')}`,
					input.name,
					`ipfs://${input.messageHash}`, // 修改为IPFS URI格式
					input.power,
					input.rarity
				);
				console.log('返回的tokenId:', tokenId);
				// 2. 将NFT信息存入数据库
				const newNFT = await ctx.db
					.insert(nftImages)
					.values({
						tokenId: tokenId.transactionHash,
						ownerAddress: input.ownerAddress,
						imageData: input.imageData,
						name: input.name,
						description: input.description,
						rarity: input.rarity,
						power: input.power,
					})
					.returning();
				return newNFT[0];
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "创建NFT失败",
					cause: error,
				});
			}
		}),

	/**
	 * 更新NFT所有者
	 */
	updateNFTOwner: publicProcedure
		.input(z.object({
			tokenId: z.string(),
			newOwnerAddress: z.string(),
		}))
		.mutation(async ({ ctx, input }) => {
			try {
				const updatedNFT = await ctx.db
					.update(nftImages)
					.set({
						ownerAddress: input.newOwnerAddress,
						updatedAt: Math.floor(Date.now() / 1000),
					})
					.where(eq(nftImages.tokenId, input.tokenId))
					.returning();

				if (!updatedNFT.length) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "NFT不存在",
					});
				}

				return updatedNFT[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "更新NFT所有者失败",
					cause: error,
				});
			}
		}),

	/**
	 * 删除指定的NFT
	 * 只有NFT的所有者才能删除
	 */
	deleteNFT: publicProcedure
		.input(z.object({
			tokenId: z.string(),
			ownerAddress: z.string(),
			signature: z.string(),    // 签名
			message: z.string(),      // 原始消息
			messageHash: z.string()   // 消息哈希
		}))
		.mutation(async ({ ctx, input }) => {
			try {
				// 首先检查NFT是否存在且属于该用户
				const nft = await ctx.db
					.select()
					.from(nftImages)
					.where(eq(nftImages.tokenId, input.tokenId))
					.limit(1);

				if (!nft.length) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "NFT不存在",
					});
				}

				if (nft[0]?.ownerAddress !== input.ownerAddress) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "您不是该NFT的所有者，无权删除",
					});
				}

				// 执行删除操作
				const deletedNFT = await ctx.db
					.delete(nftImages)
					.where(eq(nftImages.tokenId, input.tokenId))
					.returning();

				return deletedNFT[0];
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "删除NFT失败",
					cause: error,
				});
			}
		}),
});

