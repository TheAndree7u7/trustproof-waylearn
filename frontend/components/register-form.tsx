import type { FormEvent } from "react"
import { EvidenceInput } from "./evidence-input"

export function RegisterForm({ disabled, onRegister }: {
  disabled: boolean
  onRegister: (id: string, hash: string) => void
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    onRegister(String(fields.get("id") ?? ""), String(fields.get("evidence") ?? ""))
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <label className="field-stack">
        Identificador de la credencial
        <input name="id" placeholder="CERT-2026-001" required spellCheck={false}
          disabled={disabled} autoComplete="off" />
      </label>
      <EvidenceInput disabled={disabled} />
      <button type="submit" className="button" disabled={disabled}>Registrar credencial</button>
    </form>
  )
}
