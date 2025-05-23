// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import {
	blob,
	index,
	integer,
	sqliteTableCreator,
	text,
} from "drizzle-orm/sqlite-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => `nft_game_${name}`);

/**
 * NFT表情包数据表
 * 存储NFT图片和相关元数据
 */
export const nftImages = createTable("nft_images", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	// NFT的唯一标识符（链上token ID）
	tokenId: text("token_id").notNull().unique(),
	// NFT所有者的钱包地址
	ownerAddress: text("owner_address").notNull(),
	// NFT图片数据（IPFS hash或者base64编码）
	imageData: text("image_data").notNull(),
	// NFT名称
	name: text("name").notNull(),
	// NFT描述
	description: text("description"),
	// NFT稀有度（0-100）
	rarity: integer("rarity").notNull(),
	// NFT战力值
	power: integer("power").notNull(),
	// NFT创建时间
	createdAt: integer("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	// NFT最后更新时间
	updatedAt: integer("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	// 铸造NFT的链上交易哈希
	txHash: text("tx_hash"),
	// 铸造NFT所在区块号
	blockNumber: integer("block_number"),
	// 是否已上链
	isOnChain: integer("is_on_chain").default(0),
});

// 创建索引以优化查询性能
