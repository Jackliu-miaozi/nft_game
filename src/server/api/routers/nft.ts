import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { verifyMessage } from "viem";
import { createPublicClient, http, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import NFTEmojiABI from "@/contracts/NFTEmojiABI.json";

import { nftImages } from "../../db/schema";
import { eq } from "drizzle-orm";

// 创建公共客户端，用于读取区块链数据
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL)
});

// 创建钱包客户端，用于发送交易
const account = privateKeyToAccount(process.env.NFT_PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL)
});

// NFT合约地址
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as `0x${string}`;

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
   * 将图片上传到IPFS并在区块链上铸造NFT
   */
  createNFT: publicProcedure
    .input(
      z.object({
        tokenId: z.string(),
        ownerAddress: z.string(),
        imageData: z.string(),
        name: z.string(),
        description: z.string().optional(),
        rarity: z.number(),
        power: z.number(),
        signature: z.string(),
        message: z.string(),
        messageHash: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 验证签名
      const isValid = await verifyMessage({
        address: input.ownerAddress as `0x${string}`,
        message: input.message,
        signature: input.signature as `0x${string}`,
      });

      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "签名验证失败",
        });
      }

      try {
        // 1. 将图片上传到IPFS（这里简化为存储到数据库）
        const nftImageArr = await ctx.db.insert(nftImages).values({
          tokenId: input.tokenId,
          ownerAddress: input.ownerAddress,
          imageData: input.imageData,
          name: input.name,
          description: input.description || "",
          rarity: input.rarity,
          power: input.power,
        }).returning();
        
        const nftImage = nftImageArr[0];
        // 2. 调用智能合约铸造NFT
        const { request } = await publicClient.simulateContract({
          address: NFT_CONTRACT_ADDRESS,
          abi: NFTEmojiABI,
          functionName: "mint",
          args: [
            input.ownerAddress as `0x${string}`,
            input.name,
            `ipfs://${nftImage?.id}`, // 这里使用数据库ID作为URI，实际应使用IPFS URI
            BigInt(input.power),
            BigInt(input.rarity),
            input.signature as `0x${string}`,
            input.message
          ],
          account
        });

        // 发送交易
        const txHash = await walletClient.writeContract(request);

        // 等待交易确认
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash
        });

        // 3. 更新数据库中的NFT记录
        await ctx.db
          .update(nftImages)
          .set({
            txHash: txHash,
            blockNumber: receipt.blockNumber ? Number(receipt.blockNumber) : undefined,
            isOnChain: 1
          })
          .where(eq(nftImages.id, nftImage?.id ?? 0));

        return {
          success: true,
          nftId: nftImage?.id,
          tokenId: input.tokenId,
          txHash: txHash
        };
      } catch (error) {
        console.error("创建NFT失败:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "创建NFT失败，请重试",
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