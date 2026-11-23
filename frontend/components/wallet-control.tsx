import type { usePhantom } from "@/lib/wallet"

export function WalletControl({ wallet, disabled }: {
  wallet: ReturnType<typeof usePhantom>
  disabled: boolean
}) {
  const address = wallet.address?.toBase58()
  return (
    <div className="wallet-control">
      <div>
        <p className="wallet-state">{address ? "Emisor conectado" : "Wallet del emisor"}</p>
        {address
          ? <code className="wallet-address" title={address}>{address}</code>
          : <p className="muted">Conecta Phantom para firmar cambios en Devnet.</p>}
        {wallet.error && <p className="form-error" role="alert">{wallet.error}</p>}
      </div>
      <button type="button" className="button button-secondary" disabled={disabled || wallet.connecting}
        onClick={() => { void wallet.toggle() }}>
        {wallet.connecting ? "Abriendo Phantom…" : address ? "Desconectar" : "Conectar Phantom"}
      </button>
    </div>
  )
}
