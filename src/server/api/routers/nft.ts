import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { nftImages } from "../../db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

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
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const newNFT = await ctx.db
          .insert(nftImages)
          .values({
            tokenId: input.tokenId,
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
});