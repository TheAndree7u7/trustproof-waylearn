import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { Program } from "@coral-xyz/anchor"
import {
  Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction,
} from "@solana/web3.js"

const port = Number(process.env.TRUSTPROOF_TEST_PORT || 8899)
assert.ok(Number.isInteger(port) && port >= 1024 && port <= 65535, "Indica un puerto local válido")
const connection = new Connection("http://127.0.0.1:" + port, "confirmed")
const idl = JSON.parse(await readFile(new URL("../lib/certificate_registry.json", import.meta.url), "utf8"))
const program = new Program(idl, { connection })
const [issuer, outsider] = [Keypair.generate(), Keypair.generate()]
const id = Array.from(Keypair.generate().publicKey.toBytes())
const originalHash = Array(32).fill(31)
const changedHash = Array(32).fill(47)
const [credential] = PublicKey.findProgramAddressSync(
  [new TextEncoder().encode("credential"), issuer.publicKey.toBytes(), Uint8Array.from(id)],
  program.programId,
)

async function fund(wallet) {
  const block = await connection.getLatestBlockhash()
  const signature = await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL)
  const confirmation = await connection.confirmTransaction({ ...block, signature }, "confirmed")
  assert.equal(confirmation.value.err, null)
}

async function send(method, wallet) {
  const instruction = await method.instruction()
  return sendAndConfirmTransaction(connection, new Transaction().add(instruction), [wallet])
}

function accounts(wallet) {
  return { credential, issuer: wallet.publicKey }
}

await Promise.all([fund(issuer), fund(outsider)])
const registered = await send(program.methods.register(id, originalHash).accountsStrict({
  ...accounts(issuer), systemProgram: SystemProgram.programId,
}), issuer)
const issued = await program.account.credential.fetch(credential)
assert.ok(issued.issuer.equals(issuer.publicKey))
assert.deepEqual(issued.evidenceHash, originalHash)
assert.equal(issued.revoked, false)

const unauthorized = /ConstraintSeeds|Unauthorized|0x7d6|0x1770/
await assert.rejects(() => send(program.methods.update(id, changedHash).accountsStrict(accounts(outsider)), outsider), unauthorized)
await assert.rejects(() => send(program.methods.revoke(id).accountsStrict(accounts(outsider)), outsider), unauthorized)
await assert.rejects(() => send(program.methods.close(id).accountsStrict(accounts(issuer)), issuer), /CredentialStillActive|0x1772/)

const updated = await send(program.methods.update(id, changedHash).accountsStrict(accounts(issuer)), issuer)
assert.deepEqual((await program.account.credential.fetch(credential)).evidenceHash, changedHash)

const revoked = await send(program.methods.revoke(id).accountsStrict(accounts(issuer)), issuer)
const revocation = await program.account.credential.fetch(credential)
assert.equal(revocation.revoked, true)
assert.ok(revocation.revokedAt)
await assert.rejects(() => send(program.methods.update(id, originalHash).accountsStrict(accounts(issuer)), issuer), /AlreadyRevoked|0x1771/)
await assert.rejects(() => send(program.methods.close(id).accountsStrict(accounts(outsider)), outsider), unauthorized)

const before = await connection.getBalance(issuer.publicKey)
const rent = (await connection.getAccountInfo(credential)).lamports
const closed = await send(program.methods.close(id).accountsStrict(accounts(issuer)), issuer)
assert.equal(await connection.getAccountInfo(credential), null)
const closeTransaction = await connection.getTransaction(closed, { commitment: "confirmed" })
assert.ok(closeTransaction?.meta)
assert.equal(await connection.getBalance(issuer.publicKey), before + rent - closeTransaction.meta.fee)

console.log(JSON.stringify({
  checked: ["register", "read", "update", "revoke", "close", "issuer-only", "rent-returned"],
  credential: credential.toBase58(), registered, updated, revoked, closed,
}, null, 2))
