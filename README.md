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

Programa `6EkKHfzSRojzjWjkeEed9ah19UhG38PMMLvgpqEYd4bU`. La revisión de entrega se desplegó en el slot **525429486**. Se descargó y comparó el binario en cadena con la compilación de Anchor. [Programa en Solana Explorer](https://explorer.solana.com/address/6EkKHfzSRojzjWjkeEed9ah19UhG38PMMLvgpqEYd4bU?cluster=devnet) · [Actualización del programa](https://explorer.solana.com/tx/2hvXcjfZ78awrak9toAHvr2JMVaqs6zpCpatuAqg8vATgwmA3qtU8MBwn7M2GYmGmKtzGUXKd2Vtu3hhAYnhFqrU?cluster=devnet)

### Evidencias de funcionamiento

La prueba empezó con la PDA `GS3py1gQMTpEc16iE4o171yxKJNzwT7e5zfvsFPbnQg` sin registrar. Se usó el identificador `CERT-WAYLEARN-20261123-CICLO` y datos de prueba.

| Operación | Evidencia en Devnet | Slot | Resultado observado |
| --- | --- | ---: | --- |
| Crear y leer | [Ver transacción](https://explorer.solana.com/tx/2dxw835VaTBSvNTg85iJ3tjUJcymQm8UMwyVy9q8KaRRf3uggURH7138jqbbnA4jY4mT5nopnBp5eaDf2mhixCXF?cluster=devnet) | 525429716 | PDA activa con hash inicial y relación con el emisor. |
| Modificar | [Ver transacción](https://explorer.solana.com/tx/3udXmy9PR2eQtA4esmHtoquGtrcXARkp3zHUvcZBCsfoxmrYR75e5xunjxdePa8Z335eAZMXx2ccGRgz6fYsCahN?cluster=devnet) | 525429744 | Se actualizó el hash de la misma PDA. El emisor y el identificador coincidieron. |
| Revocar | [Ver transacción](https://explorer.solana.com/tx/3sPPDQy4cCbwtf3X2ngU6hJd4QVn7ei31FVhsPQqP13BGKqRdjrS2erEwbuTxN325Xncwj3LfrJgPHA4E2TJPnYt?cluster=devnet) | 525429751 | La lectura devolvió estado revocado y conservó el hash actualizado. |
| Cerrar | [Ver transacción](https://explorer.solana.com/tx/EwySmDEMB6YEUW61wRqQRexct7yTB1w3FMCs2XAu3fuV8dpGokaVfoDvTVvYJHdvmHXucsJSzAgkBx3wWWUVFjV?cluster=devnet) | 525429764 | La PDA dejó de existir. Se devolvieron 1275080 lamports de renta al emisor. La comisión fue de 5000 lamports. |

- Hash inicial `fcc1f536ed57e1b8daec6df834031cdcf5a2225b725a603c6bfa321bf63405b6`
- Hash actualizado `fa3c34429cb11078d6ebea6c19944b6a56aaa68c4c1c5906dd90134632fce5dc`

### Comprobación de permisos

En cada simulación se verificó el error del programa y se leyó de nuevo la PDA para confirmar que conservó su estado.

| Operación simulada | Error del programa | Slot observado |
| --- | --- | ---: |
| Actualizar con otra wallet | `ConstraintSeeds` | 525429725 |
| Actualizar con un identificador ajeno a la PDA | `ConstraintSeeds` | 525429727 |
| Cerrar una credencial activa | `CredentialStillActive` | 525429729 |
| Editar una credencial revocada | `AlreadyRevoked` | 525429756 |
| Cerrar una credencial revocada con otra wallet | `ConstraintSeeds` | 525429757 |

### Consulta desde la interfaz

En la demo, elige **Por PDA**, pega `6xUSf7MSuPoQEQT6EH2rJkj6iA7oiS5Jt5bw4MVU9kf` y selecciona **Consultar credencial**. La aplicación muestra la credencial activa `CERT-WAYLEARN-20261123-DEMO`, el emisor y el SHA-256 de su evidencia. [PDA de muestra](https://explorer.solana.com/address/6xUSf7MSuPoQEQT6EH2rJkj6iA7oiS5Jt5bw4MVU9kf?cluster=devnet) · [Registro de la muestra](https://explorer.solana.com/tx/2UDAc2FtEdhtMe57dgL9Wpb8XkNGkdBYKmYdQPyEDvejq8yt9Urq7iFNX1EPHrF9TXcGdVg1bQtSjAAv5RrFbkKH?cluster=devnet) · [Captura de la consulta](evidencias/consulta-devnet.png)

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
