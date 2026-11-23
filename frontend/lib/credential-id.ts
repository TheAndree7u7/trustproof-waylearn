const SHA256_HEX = /^[0-9a-f]{64}$/i

export function evidenceHashBytes(value: string) {
  const hex = value.trim()
  if (!SHA256_HEX.test(hex)) {
    throw new Error("Ingresa un hash SHA-256 de 64 caracteres hexadecimales.")
  }
  return Uint8Array.from(hex.match(/../g)!, (pair) => Number.parseInt(pair, 16))
}

export function hexFromBytes(bytes: Iterable<number>) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function credentialIdBytes(value: string) {
  const id = value.trim().normalize("NFC")
  if (!id) throw new Error("Ingresa el identificador de la credencial.")
  if (SHA256_HEX.test(id)) return evidenceHashBytes(id)

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(id))
  return new Uint8Array(digest)
}
