# Recuperación de la interfaz estable del chat, 22/11/2026

## Causa y referencia

- La versión visual v468 del panel conservaba compositor, ficha, flujo, menú y selección. El commit `a7e3da4` de la migración ocultó por CSS `.escribir`, `#chatFlujo`, `#barraSeleccion` y `#barraCita`; `0a3d228` añadió un segundo formulario de texto. Eso produjo la interfaz recortada que denunció el dueño.
- Se descartó y revirtió con `d8e37b0` una propuesta local de ficha abreviada. Esta corrección reutiliza la estructura original; no sustituye la ficha por una tarjeta nueva.

## Alcance de este cambio

- Se ven de nuevo el compositor original, la ficha completa, el flujo y las opciones de mensajes. El botón original de envío usa `crmWebSend` con el mismo `request_id` estable y seguimiento de estado; se quitó el segundo formulario.
- El menú Más conserva un acceso a WhatsApp Web. El aviso del estado del puente anterior se ignora para estos chats, porque el receptor de recuperación usa otra ruta y el aviso daba un falso «envíos desactivados».
- El receptor actual no acepta las escrituras del `crmApi` anterior. Los controles que dependen de esas escrituras permanecen visibles pero deshabilitados, con una explicación al pasar el puntero. Selección, información y copia sí siguen funcionando. No se alteraron contactos, sesiones, Caja, ventas ni finanzas.

## Evidencia

- Producción antes de este cambio: tarea `D-Carela Sincronizar WhatsApp Web` en marcha, sesión `connected` y `manual_dispatch_ready`; Services insertó una vez el mensaje recibido el 21/11 a las 21:09 UTC. El CRM autenticado mostró ese mensaje en su chat a las 17:09 hora local. Esta evidencia no prueba una entrada nueva el 22/11.
- Prueba local aislada en `C:\tmp\dcarela-crm-wa-web-qa.cjs`: mensaje ficticio visible; ficha abre/cierra; compositor original visible; un texto ficticio llegó **una vez** al receptor local falso; opciones sin respaldo deshabilitadas; selección, información y copia visibles; cero errores JS, cero HTTP fallidos y cero escrituras productivas. Resultado: `C:\tmp\dcarela-wa-web-ui-qa-result.json`.
- Capturas locales: `C:\tmp\dcarela-wa-web-ficha-revisar.png`, `C:\tmp\dcarela-wa-web-seleccion-revisar.png` y `C:\tmp\dcarela-wa-web-mobile-revisar.png`. Viewport móvil 390 × 844 sin desborde horizontal.
- `node --check` del módulo inline, `git diff --check` y SHA-256 idéntico de `index.html` y `v2.html` aprobados.

## Pendiente de comprobar

- Envío real de texto desde esta revisión a un cliente y un mensaje nuevo recibido después del despliegue. No se enviaron mensajes de prueba a clientes.
- Acciones heredadas de media, edición, borrado, transferencia, cambio de etapa, notas y bot necesitan respaldo seguro del servidor local antes de reactivarse. Su presencia visual no equivale a funcionamiento.

## Actualización de la auditoría, 22/11/2026: estado de v480

La lista anterior describe la primera recuperación de las 05:25 UTC y no el estado final del día. Se cotejó `CONTINUIDAD.md`, el código público v480 (`75dfeff0c9cfd22325658ffff377dcdcbb3eab6d`), siete recursos HTTP iguales a Git y el Worker desplegado `7cccfb79-92a4-4b41-a107-93ff03e11ad2` al 100 %.

- **Presentes en el CRM publicado:** compositor y ficha originales, flujo, selección/información/copia, envío manual de texto con `request_id` y consulta de estado, Nuevo chat, etapa, etiquetas, Atendido, confirmación de sesión realizada y la página Canales que ya no confunde el puente heredado con el 5644. El adaptador separa las consultas del chat y pausa o retrasa sondeos en pestañas ocultas y tras errores.
- **Pruebas aisladas:** `dcarela-crm-v480-canales-qa.cjs` usó usuario/PostgreSQL ficticios: tarjeta, navegación, chat, ficha y un envío al receptor falso, sin errores JS ni escrituras productivas. `crm-web-chat.test.cjs` con `DCARELA_TEST_POSTGRES=1` pasó 1/1, incluidos negocio, etapa, sesión, modo humano y Nuevo chat idempotente. La prueba local anterior de v475 guardó y releyó etapa/Atendido. Etiquetas tienen ruta y controlador pero no un clic autenticado comprobado.
- **No certificados en producción:** envío real de un texto nuevo y su acuse, clics con sesión del dueño, respuesta del bot, medios antiguos, recuperación completa de historial y causa individual de los 503. Adjuntos, transferencia, edición/borrado y reactivación del bot siguen bloqueados en el acceso de recuperación. El capturador dedicado informó `connected=true` y 19 mensajes directos guardados desde su reinicio, pero el panel no lee aún su heartbeat y por eso Canales muestra «sin verificar».

Esta actualización documental queda en la rama local de trabajo; no se republicó el panel para cambiar el MD.
