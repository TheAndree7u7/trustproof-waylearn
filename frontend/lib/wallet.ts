"use client"

import { useEffect, useState } from "react"
import { PublicKey, type Transaction } from "@solana/web3.js"

type WalletPublicKey = { toBase58(): string }
type WalletEvent = "accountChanged" | "connect" | "disconnect"
type Phantom = {
  isPhantom: boolean
  publicKey?: WalletPublicKey | null
  connect(): Promise<{ publicKey: WalletPublicKey }>
  disconnect(): Promise<void>
  signTransaction(transaction: Transaction): Promise<Transaction>
  on?(event: WalletEvent, callback: () => void): void
  off?(event: WalletEvent, callback: () => void): void
}

function getPhantom() {
  const browser = window as Window & { phantom?: { solana?: Phantom }; solana?: Phantom }
  const provider = browser.phantom?.solana ?? browser.solana
  return provider?.isPhantom ? provider : null
}

export function usePhantom() {
  const [address, setAddress] = useState<PublicKey | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const provider = getPhantom()
    if (!provider) return
    const sync = () => setAddress(provider.publicKey ? new PublicKey(provider.publicKey.toBase58()) : null)
    sync()
    provider.on?.("accountChanged", sync)
    provider.on?.("connect", sync)
    provider.on?.("disconnect", sync)
    return () => {
      provider.off?.("accountChanged", sync)
      provider.off?.("connect", sync)
      provider.off?.("disconnect", sync)
    }
  }, [])

  async function toggle() {
    const provider = getPhantom()
    setError("")
    if (!provider) {
      setError("Instala Phantom y abre esta página en el mismo navegador.")
      return
    }

    setConnecting(true)
    try {
      if (provider.publicKey) {
        await provider.disconnect()
        setAddress(null)
      } else {
        const { publicKey } = await provider.connect()
        setAddress(new PublicKey(publicKey.toBase58()))
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo conectar la wallet.")
    } finally {
      setConnecting(false)
    }
  }

  return { address, connecting, error, toggle }
}

export async function signWithPhantom(transaction: Transaction, signer: PublicKey) {
  const provider = getPhantom()
  if (!provider || provider.publicKey?.toBase58() !== signer.toBase58()) {
    throw new Error("Conecta la wallet del emisor para firmar esta operación.")
  }
  return provider.signTransaction(transaction)
}
