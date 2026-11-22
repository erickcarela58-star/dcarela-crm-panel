# WhatsApp Web: recepción y controles del chat (22/11/2026)

## Recepción productiva comprobada

- El capturador `D-Carela Sincronizar WhatsApp Web` estaba `Running` y su sesión quedó `connected` / `manual_dispatch_ready` tras la reconexión de 03:35 UTC. El proceso tenía conexiones TCP establecidas a Meta al comprobarlo. Esto acredita conectividad en ese instante, no una sesión perpetua.
- Servicios registró el lote de entrada del 21/11 a las 21:10 UTC con una inserción y cero duplicados; no quedó lote pendiente en el spool observado.
- Con la sesión del dueño, el CRM público abrió la conversación de ana cleyri y mostró el mensaje entrante «Hola buenas tardes» del 21/11 a las 17:09 hora local, con su historial. Es una prueba de extremo a extremo de ese mensaje hasta la bandeja. No se generó un mensaje nuevo de prueba el 22/11.
- El dominio público seguía sirviendo el commit `6b3186a` al hacer la comprobación; estos cambios visuales son solo locales.

## Corrección local preparada

- El modo de recuperación ocultaba por CSS la selección de mensajes y dejaba el botón de ficha sin contenido al abrir el chat. Ahora muestra una ficha de consulta y selección/copia; el menú expone solamente selección, información y copia, acciones que funcionan sin el `crmApi` anterior.
- El compositor manual de texto conserva el transporte `crmWebSend` y se adapta a la estética actual. El aviso del `bridgeStatus` heredado ya no anuncia erróneamente envíos desactivados para los chats QR atendidos por el receptor de recuperación.
- No se cambiaron bases de datos, Firebase, finanzas, Caja, claves, sesiones ni el capturador. No hubo envíos de prueba.

## Pruebas y límites

- Prueba aislada `C:\tmp\dcarela-crm-wa-web-qa.cjs`: base efímera con un mensaje ficticio, conexiones externas bloqueadas y **cero escrituras productivas**. Resultado en `C:\tmp\dcarela-wa-web-ui-qa-result.json`: mensaje, ficha, menú y selección correctos; cero errores JS y cero respuestas HTTP fallidas del origen local.
- Capturas para revisión: `C:\tmp\dcarela-wa-web-ficha-revisar.png` y `C:\tmp\dcarela-wa-web-seleccion-revisar.png`.
- `node --check` del módulo inline y `git diff --check` pasaron; `index.html` y `v2.html` tienen SHA-256 idéntico.
- **Sin publicar:** se requiere el OK del dueño sobre las capturas para este cambio de estética, según su instrucción previa. Las opciones antiguas de edición, borrado, reacción, reenvío, cambio de etapa y transferencia no tienen aquí acuse del servidor y no se declaran restauradas. Tampoco se verificó un nuevo mensaje entrante en el instante de esta revisión.
