import { useId, useState, type ChangeEvent } from "react"
import { hexFromBytes } from "@/lib/credential-id"

export function EvidenceInput({ disabled }: { disabled: boolean }) {
  const inputId = useId()
  const [hash, setHash] = useState("")
  const [hashing, setHashing] = useState(false)
  const [error, setError] = useState("")

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    event.currentTarget.value = ""
    setError("")
    setHash("")
    setHashing(true)
    try {
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
      setHash(hexFromBytes(new Uint8Array(digest)))
    } catch {
      setError("No se pudo calcular el hash. Intenta con el archivo de nuevo o pega el SHA-256.")
    } finally {
      setHashing(false)
    }
  }

  return (
    <div className="field-stack">
      <label htmlFor={inputId}>SHA-256 de la evidencia</label>
      <input id={inputId} name="evidence" className="mono" value={hash} required
        pattern="[0-9a-fA-F]{64}" maxLength={64} spellCheck={false}
        autoComplete="off" aria-describedby={inputId + "-help"}
        readOnly={hashing} disabled={disabled}
        onChange={(event) => { setHash(event.target.value); setError("") }} />
      <p className="muted" id={inputId + "-help"}>Pega 64 caracteres hexadecimales o calcula el hash de un archivo local.</p>
      <input id={inputId + "-file"} className="visually-hidden" type="file"
        onChange={(event) => { void readFile(event) }} disabled={disabled || hashing} />
      <label htmlFor={inputId + "-file"} className="file-label">
        {hashing ? "Calculando SHA-256…" : "Elegir archivo de evidencia"}
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  )
}
