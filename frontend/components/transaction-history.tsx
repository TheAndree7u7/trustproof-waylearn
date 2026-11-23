import { transactionExplorerUrl } from "@/lib/explorer"
import type { RegistryAction } from "@/lib/registry-transactions"

export const actionLabel: Record<RegistryAction["kind"], string> = {
  register: "Registro",
  update: "Actualización",
  revoke: "Revocación",
  close: "Cierre",
}

export type Receipt = {
  kind: RegistryAction["kind"]
  signature: string
  confirmed: boolean
}

export function TransactionHistory({ receipts }: { receipts: Receipt[] }) {
  if (!receipts.length) return null
  return (
    <section className="panel" aria-labelledby="receipts-title">
      <h2 id="receipts-title">Transacciones de esta sesión</h2>
      <ul className="transaction-list">
        {receipts.map((receipt) => (
          <li key={receipt.signature}>
            <div>
              <strong>{actionLabel[receipt.kind]}</strong>
              <span className="muted">{receipt.confirmed ? "Confirmada" : "Enviada · verificar en Explorer"}</span>
            </div>
            <a href={transactionExplorerUrl(receipt.signature)} target="_blank" rel="noreferrer"
              aria-label={"Ver " + actionLabel[receipt.kind].toLowerCase() + " en Solana Explorer"}>
              <code>{receipt.signature.slice(0, 12)}…</code> ↗
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
