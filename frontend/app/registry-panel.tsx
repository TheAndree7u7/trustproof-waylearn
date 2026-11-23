"use client"

import { useRef, useState } from "react"
import { PublicKey } from "@solana/web3.js"
import { CredentialActions } from "@/components/credential-actions"
import { CredentialCard } from "@/components/credential-card"
import { LookupForm, type CredentialLookup } from "@/components/lookup-form"
import { RegisterForm } from "@/components/register-form"
import { TransactionHistory, actionLabel, type Receipt } from "@/components/transaction-history"
import { WalletControl } from "@/components/wallet-control"
import { credentialIdBytes, evidenceHashBytes } from "@/lib/credential-id"
import { accountExplorerUrl } from "@/lib/explorer"
import { credentialAddress, getCredential, registryAddress, type Credential } from "@/lib/registry"
import { writeCredential, type RegistryAction } from "@/lib/registry-transactions"
import { usePhantom } from "@/lib/wallet"

function solanaAddress(value: string, field: string) {
  try {
    return new PublicKey(value.trim())
  } catch {
    throw new Error(field + " debe ser una dirección válida de Solana.")
  }
}

type Selection = { address: PublicKey; credential: Credential | null }

export function RegistryPanel() {
  const wallet = usePhantom()
  const inFlight = useRef(false)
  const [operation, setOperation] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [selection, setSelection] = useState<Selection | null>(null)
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const isBusy = Boolean(operation)
  const credential = selection?.credential
  const canManage = Boolean(credential && wallet.address?.equals(credential.issuer))
  const unavailable = !wallet.address || isBusy

  async function run(label: string, task: () => Promise<void>) {
    if (inFlight.current) return
    inFlight.current = true
    setOperation(label)
    setError("")
    setNotice("")
    try {
      await task()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "La operación falló. Intenta de nuevo.")
    } finally {
      inFlight.current = false
      setOperation("")
    }
  }

  function lookup(query: CredentialLookup) {
    void run("Consultando Devnet…", async () => {
      setSelection(null)
      const address = query.mode === "pda"
        ? solanaAddress(query.address, "La PDA")
        : credentialAddress(solanaAddress(query.issuer, "La clave del emisor"), await credentialIdBytes(query.id))
      setSelection({ address, credential: await getCredential(address) })
    })
  }

  async function execute(action: RegistryAction, issuer: PublicKey, id: Uint8Array) {
    const address = credentialAddress(issuer, id)
    const { signature, slot } = await writeCredential(action, issuer, id, (signature) => {
      setReceipts((items) => [{ kind: action.kind, signature, confirmed: false }, ...items].slice(0, 12))
    })
    setReceipts((items) => items.map((item) => item.signature === signature ? { ...item, confirmed: true } : item))
    setNotice("Devnet confirmó la transacción de " + actionLabel[action.kind].toLowerCase() + ".")
    setSelection(null)
    setSelection({ address, credential: await getCredential(address, slot) })
  }

  function register(id: string, hash: string) {
    const issuer = wallet.address
    if (!issuer || !hash) return
    void run("Esperando firma y confirmación…", async () => {
      const evidenceHash = evidenceHashBytes(hash)
      await execute({ kind: "register", evidenceHash }, issuer, await credentialIdBytes(id))
    })
  }

  function manage(kind: "update" | "revoke" | "close", value = "") {
    if (!credential || !canManage || (kind === "update" && !value)) return
    void run("Esperando firma y confirmación…", async () => {
      const action = kind === "update"
        ? { kind, evidenceHash: evidenceHashBytes(value) } as const
        : { kind }
      await execute(action, credential.issuer, Uint8Array.from(credential.credentialId))
    })
  }

  return (
    <div className="registry">
      <WalletControl wallet={wallet} disabled={isBusy} />
      <div className="registry-grid">
        <section className="panel" aria-labelledby="register-title">
          <h2 id="register-title">Registrar</h2>
          <p className="muted">Crea una PDA asociada a tu clave pública y al identificador de la credencial.</p>
          <RegisterForm disabled={unavailable} onRegister={register} />
        </section>
        <section className="panel" aria-labelledby="lookup-title">
          <h2 id="lookup-title">Consultar</h2>
          <p className="muted">Lee el estado actual de una credencial con su PDA o con los datos del emisor.</p>
          <LookupForm connectedIssuer={wallet.address?.toBase58() ?? ""} disabled={isBusy} onLookup={lookup} />
        </section>
      </div>
      <div className="feedback">
        <p role="status">{operation || notice}</p>
        {error && <p role="alert" className="form-error">{error}</p>}
      </div>
      {credential && (
        <div className="panel result-panel">
          <CredentialCard credential={credential} />
          {canManage ? (
            <CredentialActions key={credential.address.toBase58() + ":" + credential.revoked}
              revoked={credential.revoked} disabled={isBusy} onUpdate={(hash) => manage("update", hash)}
              onRevoke={() => manage("revoke")} onClose={() => manage("close")} />
          ) : (
            <p className="muted">Las operaciones de escritura requieren la firma de la wallet emisora.</p>
          )}
        </div>
      )}
      {selection && !credential && (
        <div className="panel result-panel">
          <h2>Cuenta inexistente</h2>
          <p className="muted">Devnet devuelve una cuenta vacía para esta PDA.</p>
          <code>{selection.address.toBase58()}</code>
        </div>
      )}
      <TransactionHistory receipts={receipts} />
      <footer className="program-footer">
        <a href={accountExplorerUrl(registryAddress)} target="_blank" rel="noreferrer">Programa de TrustProof en Solana Explorer ↗</a>
      </footer>
    </div>
  )
}
