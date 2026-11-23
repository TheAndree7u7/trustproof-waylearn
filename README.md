# TrustProof

Registro verificable de credenciales en Solana. Una cuenta derivada del programa (PDA) guarda la clave pública del emisor, el identificador y el SHA-256 de la evidencia. La interfaz puede calcular el hash de un archivo en el navegador.

## Ruta y aporte

**Proyecto propio · Blue Sky (Libre).** El punto de partida es el programa de TrustProof que registraba y revocaba credenciales. El aporte agrega actualización del hash, cierre después de la revocación y una interfaz que lee y ejecuta las instrucciones desde el IDL de Anchor.

El programa exige la firma del emisor y comprueba que la PDA corresponde a ese emisor y a ese identificador. El cierre devuelve la renta a la misma wallet.

## Demo

Requiere Node.js 22 y Phantom para firmar operaciones. La consulta de una PDA es pública.

```sh
cd frontend
npm ci
npm run dev
```

Abre `http://localhost:3000`. Para registrar una credencial, conecta una wallet con SOL de Devnet y escribe un identificador como `CERT-2026-001`. Usa el mismo identificador y la clave pública del emisor para consultar la cuenta, o pega su dirección PDA. El cliente carga el IDL de Anchor incluido en el repositorio.

| Acción | Permiso |
| --- | --- |
| Registrar | La wallet emisora firma y financia la PDA. |
| Consultar | Cualquier persona puede leer la PDA. |
| Actualizar evidencia | El emisor firma y la credencial debe estar activa. |
| Revocar | El emisor firma y la PDA conserva su estado revocado. |
| Cerrar | El emisor firma después de revocar y recupera la renta. |

La PDA se deriva con las semillas `credential`, clave pública del emisor e identificador de 32 bytes. Un identificador de 64 caracteres hexadecimales se interpreta como esos 32 bytes. Los demás se normalizan en NFC y se convierten a SHA-256.

## Devnet

El programa está desplegado en `6EkKHfzSRojzjWjkeEed9ah19UhG38PMMLvgpqEYd4bU`. La revisión de esta rama añade `update` y `close`. Queda pendiente actualizar el despliegue y registrar evidencias de esas instrucciones en Devnet. [Programa en Solana Explorer](https://explorer.solana.com/address/6EkKHfzSRojzjWjkeEed9ah19UhG38PMMLvgpqEYd4bU?cluster=devnet) · [Transacción de despliegue](https://explorer.solana.com/tx/67r2g7omsNxdUiE59EznuN5Mmw249kmhAMuSX5FJ1ecpY7q4m97vTMgY3xKXN2LytxYjDKpE2GFmQa8MrQAbWwy?cluster=devnet)

## Prueba local

Desde la raíz del repositorio, con Anchor 0.32.1 y Solana CLI instalados, compila el programa y arranca el validador.

```sh
cd backend/anchor
anchor build
solana-test-validator --bpf-program 6EkKHfzSRojzjWjkeEed9ah19UhG38PMMLvgpqEYd4bU target/deploy/certificate_registry.so
```

En otra terminal, desde la raíz del repositorio, instala las dependencias del cliente y ejecuta la prueba.

```sh
cd frontend
npm ci
npm run typecheck
npm run test:localnet
```

La prueba usa wallets temporales y verifica el ciclo completo, las restricciones del emisor y la devolución de renta.

### Casos comprobados en Localnet

La prueba parte de una credencial sin registrar, una wallet emisora y otra wallet de prueba. Consulta la PDA después de cada cambio.

| Caso | Resultado comprobado |
| --- | --- |
| Registrar y leer | La PDA guarda el emisor, el hash inicial y el estado activo. |
| Actualizar como emisor | Cambia el hash en la misma PDA y se conserva el emisor. |
| Firmar con otra wallet | El programa rechaza actualización, revocación y cierre. |
| Usar un identificador ajeno a la PDA | El programa rechaza la actualización y conserva el hash. |
| Cerrar una credencial activa | El programa rechaza el cierre y conserva la cuenta. |
| Revocar y volver a editar | La revocación queda registrada y una actualización posterior se rechaza. |
| Cerrar una credencial revocada | La PDA queda vacía y el emisor recupera la renta descontando la comisión. |

[Prueba reproducible](frontend/tests/credential-lifecycle.mjs) · [Vista móvil del registro](evidencias/interfaz-movil.png)
