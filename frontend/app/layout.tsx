import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "TrustProof · Registro de credenciales",
  description: "Emite y verifica evidencias de credenciales en Solana Devnet.",
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
