import { hexFromBytes } from "@/lib/credential-id"
import { accountExplorerUrl } from "@/lib/explorer"
import type { Credential } from "@/lib/registry"

const dateFormat = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium", timeStyle: "short", timeZone: "UTC",
})

export function CredentialCard({ credential }: { credential: Credential }) {
  const address = credential.address.toBase58()
  return (
    <article className="credential-card" aria-labelledby="credential-title">
      <div className="card-heading">
        <h3 id="credential-title">Credencial en cadena</h3>
        <span className={credential.revoked ? "status status-revoked" : "status"}>
          {credential.revoked ? "Revocada" : "Activa"}
        </span>
      </div>
      <dl className="account-data">
        <div><dt>Dirección PDA</dt><dd><code>{address}</code></dd></div>
        <div><dt>Emisor</dt><dd><code>{credential.issuer.toBase58()}</code></dd></div>
        <div><dt>Identificador en cadena</dt><dd><code>{hexFromBytes(credential.credentialId)}</code></dd></div>
        <div><dt>SHA-256 de la evidencia</dt><dd><code>{hexFromBytes(credential.evidenceHash)}</code></dd></div>
        <div><dt>Emisión (UTC)</dt><dd>{dateFormat.format(credential.issuedAt.toNumber() * 1000)}</dd></div>
        {credential.revokedAt && (
          <div><dt>Revocación (UTC)</dt><dd>{dateFormat.format(credential.revokedAt.toNumber() * 1000)}</dd></div>
        )}
      </dl>
      <a href={accountExplorerUrl(address)} target="_blank" rel="noreferrer">Ver cuenta en Solana Explorer ↗</a>
    </article>
  )
}
