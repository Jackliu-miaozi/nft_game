import { TRPCError } from "@trpc/server";
import { verifyMessage } from "viem";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

/**
 * 对战相关的API路由
 */
export const battleRouter = createTRPCRouter({
	/**
	 * 开始对战
	 * 验证签名并调用智能合约
	 */
	startBattle: publicProcedure
		.input(
			z.object({
				tokenId: z.string(),
				ownerAddress: z.string(),
				signature: z.string(),
				message: z.string(),
				messageHash: z.string(),
			}),
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
// TODO
			try {
				// 这里调用智能合约的startBattle函数
				// 实际实现需要根据您的区块链交互方式来定制

				// 模拟调用智能合约
				const txHash = `0x${Math.random().toString(16).substring(2)}`;

				// 记录对战信息到数据库
				// 这里可以添加对战记录的存储逻辑

				return {
					success: true,
					txHash,
				};
			} catch (error) {
				console.error("开始对战失败:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "开始对战失败，请重试",
				});
			}
		}),
});
