import { SystemProgram, Transaction, type PublicKey } from "@solana/web3.js"
import { connection, credentialAddress, registry } from "./registry"
import { signWithPhantom } from "./wallet"

export type RegistryAction =
  | { kind: "register" | "update"; evidenceHash: Uint8Array }
  | { kind: "revoke" | "close" }

async function buildInstruction(action: RegistryAction, issuer: PublicKey, id: Uint8Array) {
  const accounts = { credential: credentialAddress(issuer, id), issuer }
  const credentialId = Array.from(id)

  switch (action.kind) {
    case "register":
      return registry.methods
        .register(credentialId, Array.from(action.evidenceHash))
        .accountsStrict({ ...accounts, systemProgram: SystemProgram.programId })
        .instruction()
    case "update":
      return registry.methods
        .update(credentialId, Array.from(action.evidenceHash))
        .accountsStrict(accounts)
        .instruction()
    case "revoke":
      return registry.methods.revoke(credentialId).accountsStrict(accounts).instruction()
    case "close":
      return registry.methods.close(credentialId).accountsStrict(accounts).instruction()
  }
}

export async function writeCredential(
  action: RegistryAction,
  issuer: PublicKey,
  id: Uint8Array,
  onSubmitted: (signature: string) => void,
) {
  const [instruction, block] = await Promise.all([
    buildInstruction(action, issuer, id),
    connection.getLatestBlockhash("confirmed"),
  ])
  const transaction = new Transaction({
    feePayer: issuer,
    blockhash: block.blockhash,
    lastValidBlockHeight: block.lastValidBlockHeight,
  }).add(instruction)
  const signed = await signWithPhantom(transaction, issuer)
  const signature = await connection.sendRawTransaction(signed.serialize(), {
    preflightCommitment: "confirmed",
  })
  onSubmitted(signature)
  const confirmation = await connection.confirmTransaction({ ...block, signature }, "confirmed")
  if (confirmation.value.err) {
    throw new Error("Solana rechazó la operación. Revisa el resultado en Explorer.")
  }
  return { slot: confirmation.context.slot, signature }
}
