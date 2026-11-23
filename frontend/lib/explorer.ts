const EXPLORER = "https://explorer.solana.com"

export function accountExplorerUrl(address: string) {
  return EXPLORER + "/address/" + encodeURIComponent(address) + "?cluster=devnet"
}

export function transactionExplorerUrl(signature: string) {
  return EXPLORER + "/tx/" + encodeURIComponent(signature) + "?cluster=devnet"
}
