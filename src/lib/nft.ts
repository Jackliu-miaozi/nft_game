import { publicClient, walletClient } from './blockchain'
import NFTEmojiABI from 'contracts/NFTEmoji.json'

const NFT_CONTRACT_ADDRESS = '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512' // 替换为您的合约地址

/**
 * 铸造NFT
 * @param to 接收地址
 * @param name NFT名称
 * @param tokenURI 元数据URI
 * @param power 能量值
 * @param rarity 稀有度
 */
export async function mintNFT(
  to: string,
  name: string,
  tokenURI: string,
  power: number,
  rarity: number
) {
  // 准备交易请求
  const { request } = await publicClient.simulateContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFTEmojiABI.abi,
    functionName: 'mint',
    args: [to, name, tokenURI, BigInt(power), BigInt(rarity)],
    account: walletClient.account
  })

  // 发送交易
  const txHash = await walletClient.writeContract(request)
  
  // 等待交易确认
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash
  })

  return receipt
}

/**
 * 查询NFT信息
 * @param tokenId NFT ID
 */
export async function getNFT(tokenId: number) {
  return publicClient.readContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFTEmojiABI.abi,
    functionName: 'tokenMeta',
    args: [BigInt(tokenId)]
  })
}