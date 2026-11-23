import { useState, type FormEvent } from "react"

export type CredentialLookup =
  | { mode: "pda"; address: string }
  | { mode: "id"; issuer: string; id: string }

export function LookupForm({ connectedIssuer, disabled, onLookup }: {
  connectedIssuer: string
  disabled: boolean
  onLookup: (query: CredentialLookup) => void
}) {
  const [mode, setMode] = useState<"id" | "pda">("id")
  const [issuerValue, setIssuerValue] = useState("")

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    onLookup(mode === "pda"
      ? { mode: "pda", address: String(fields.get("address") ?? "") }
      : { mode: "id", issuer: issuerValue, id: String(fields.get("id") ?? "") })
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="segmented" aria-label="Método de consulta">
        <button type="button" aria-pressed={mode === "id"} disabled={disabled}
          onClick={() => setMode("id")}>Por identificador</button>
        <button type="button" aria-pressed={mode === "pda"} disabled={disabled}
          onClick={() => setMode("pda")}>Por PDA</button>
      </div>
      {mode === "id" ? (
        <>
          <div className="field-stack">
            <label htmlFor="lookup-issuer">Clave pública del emisor</label>
            <input id="lookup-issuer" name="issuer" value={issuerValue}
              onChange={(event) => setIssuerValue(event.target.value)} spellCheck={false} required
              disabled={disabled} autoComplete="off" className="mono" />
            {connectedIssuer && (
              <button type="button" className="text-button" disabled={disabled}
                onClick={() => setIssuerValue(connectedIssuer)}>Usar mi wallet</button>
            )}
          </div>
          <label className="field-stack">
            Identificador de la credencial
            <input name="id" placeholder="CERT-2026-001" required spellCheck={false} disabled={disabled} />
          </label>
        </>
      ) : (
        <label className="field-stack">
          Dirección PDA
          <input name="address" required spellCheck={false} disabled={disabled}
            autoComplete="off" className="mono" />
        </label>
      )}
      <button type="submit" className="button" disabled={disabled}>Consultar credencial</button>
    </form>
  )
}
