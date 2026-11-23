import { Program, type BN, type Idl } from "@coral-xyz/anchor"
import { Connection, PublicKey } from "@solana/web3.js"
import idl from "./certificate_registry.json"

const CREDENTIAL_SEED = new TextEncoder().encode("credential")
export const connection = new Connection(
  process.env.NEXT_PUBLIC_DEVNET_RPC_URL || "https://api.devnet.solana.com",
  "confirmed",
)
export const registry = new Program(idl as Idl, { connection })
export const registryAddress = registry.programId.toBase58()

type CredentialAccount = {
  issuer: PublicKey
  credentialId: number[]
  evidenceHash: number[]
  issuedAt: BN
  revoked: boolean
  revokedAt: BN | null
}

export type Credential = CredentialAccount & { address: PublicKey }

export function credentialAddress(issuer: PublicKey, id: Uint8Array) {
  return PublicKey.findProgramAddressSync(
    [CREDENTIAL_SEED, issuer.toBytes(), id],
    registry.programId,
  )[0]
}

export async function getCredential(address: PublicKey, minContextSlot?: number): Promise<Credential | null> {
  const account = await connection.getAccountInfo(address, { commitment: "confirmed", minContextSlot })
  if (!account) return null
  if (!account.owner.equals(registry.programId)) {
    throw new Error("La dirección pertenece a otro programa de Solana.")
  }

  const credential = registry.coder.accounts.decode<CredentialAccount>("credential", account.data)
  const expectedAddress = credentialAddress(credential.issuer, Uint8Array.from(credential.credentialId))
  if (!expectedAddress.equals(address)) throw new Error("La cuenta no coincide con la PDA de la credencial.")
  return { ...credential, address }
}
