import { useState, type FormEvent } from "react"
import { EvidenceInput } from "./evidence-input"

export function CredentialActions({ revoked, disabled, onUpdate, onRevoke, onClose }: {
  revoked: boolean
  disabled: boolean
  onUpdate: (hash: string) => void
  onRevoke: () => void
  onClose: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const label = revoked ? "Cerrar cuenta" : "Revocar credencial"

  function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    onUpdate(String(fields.get("evidence") ?? ""))
  }

  return (
    <section className="credential-actions" aria-labelledby="manage-title">
      <h3 id="manage-title">Acciones del emisor</h3>
      {!revoked && (
        <form className="form-stack" onSubmit={update}>
          <EvidenceInput disabled={disabled || confirming} />
          <button type="submit" className="button button-secondary" disabled={disabled || confirming}>
            Actualizar evidencia
          </button>
        </form>
      )}
      {confirming ? (
        <div className="confirmation">
          <p>{revoked
            ? "El cierre elimina la cuenta y devuelve su saldo de renta al emisor. Las transacciones previas siguen en Explorer."
            : "La revocación marca la credencial como revocada y habilita el cierre de la cuenta."}</p>
          <div className="button-row">
            <button type="button" disabled={disabled} className="button button-danger"
              onClick={revoked ? onClose : onRevoke}>
              {revoked ? "Confirmar cierre" : "Confirmar revocación"}
            </button>
            <button type="button" disabled={disabled} className="button button-secondary"
              onClick={() => setConfirming(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <button type="button" disabled={disabled} className="button button-danger"
          onClick={() => setConfirming(true)}>{label}</button>
      )}
    </section>
  )
}
