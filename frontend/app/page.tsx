import { RegistryPanel } from "./registry-panel"

export default function Home() {
  return (
    <main className="workspace">
      <header className="app-header">
        <span className="wordmark">TrustProof</span>
        <span className="network">Solana Devnet</span>
      </header>
      <section className="intro">
        <h1>Registro de credenciales</h1>
        <p>Emite y verifica evidencias de credenciales en Solana.</p>
      </section>
      <RegistryPanel />
    </main>
  )
}
