# Parche de nube local preparado, sin publicar

## 20/11/2026 — Publicación del CRM con el histórico de Caja aplazado

El propietario autorizó publicar el CRM antes de migrar los movimientos anteriores de Caja. Se preparó el identificador de entrega `v469-nube-local`. GitHub Pages continúa sirviendo el CRM v468 en [su dominio](https://crm.dcarelacompufoto.com/). En la comprobación del 20/11 la API de Servicios estaba conectada, aceptaba la entrada de Meta y devolvía HTTP 503 a las consultas de negocio. El corte disponible incluye conversaciones y mensajes de las 08:51:13Z. La conversación más reciente de esa copia tiene `update_time` de las 08:35:10Z.

Para estrenar la rama en el dominio, primero se deben recuperar las conversaciones/contactos nuevos, membresías, medios necesarios y el estado de la cola del propio CRM. Revisar acuses y deduplicación antes de conectar las dos líneas de WhatsApp y los publicadores. El importador de corte completo elimina documentos ausentes; un corte parcial del CRM requiere reconciliar solo su conjunto y conservar los datos de Caja. Su alcance operativo necesita bloquear por separado los trabajos y acciones financieras hasta migrar sus dependencias. El sondeo de origen mantiene el límite de cuota y la facturación desactivada.

Con el acceso de negocio abierto para CRM y las comprobaciones de sesión e ingreso aprobadas, registrar `released_at`, publicar por avance rápido desde `origin/main` y comprobar hash/versión de `/`, `/v2.html`, `/anuncios/` y del SDK. El cambio web conserva el contenedor de Windows.

Prueba del candidato v469 a las **20:40:34Z** en Chrome con API y PostgreSQL aislados. Inicio de sesión, conversación, galería, Eliminar, Nueva colaboración y recarga conservaron la sesión ficticia. Cero fallos de JavaScript y HTTP de la aplicación. Evidencia `C:/tmp/dcarela-crm-local-ui-qa-result.json`; producción conserva v468 y cinco recursos comprobados coincidieron con el `main` publicado.

**Actualización 20/11 19:45Z:** prueba Playwright contra API real sobre PostgreSQL aislado: login, conversación ficticia, galería con una pieza y Eliminar/Nueva colaboración, recarga con sesión conservada y 1365×900/390×844 sin desborde. Cero errores JS, avisos de aplicación o HTTP fallidos. Browser plugin ausente; se usó Playwright temporal con Chrome instalado, sin sesiones reales. Se corrigió la consulta REST de Estados que aún salía a Google y la página Anuncios (import-map/config/API). Evidencia fuera del repo: `C:\tmp\dcarela-crm-local-ui-qa-result.json` y capturas `C:\tmp\dcarela-crm-local-*-20261120.png`. El demo no representa datos actuales del propietario ni una respuesta real del bot.

PWA 35.59 ya fue publicada por pedido posterior del dueño; el candidato de transporte 35.60 está aislado en `C:\tmp\dcarela-pwa-nube-preparacion-20261120`, todavía sin publicar. No hay que volver a instalar CRM. WhatsApp oficial ya tiene token/ID verificados y cifrados en ambos nodos; callbacks oficiales reciben en Cloudflare, sin procesamiento de negocio en staging. La conciliación/corte siguen pendientes por cuota del origen. Estado prioritario del backend: `CONSUMIDORES_Y_TARJETA_20261120.md`.

Esta rama prepara exclusivamente el transporte del CRM v468 vigente hacia la API local. Conserva la galería y sus botones. **No fusionar ni publicar antes del corte conciliado**: la entrada `https://dcarela-api.dcarela-compufoto.workers.dev` todavía está cerrada a tráfico productivo y la reconciliación final de Firestore falló por cuota HTTP429.

Cambios: import-map en `index.html`/`v2.html`, URLs en `crm-config.js`, adaptadores en `nube-sdk/`. Las sesiones se pueden intercambiar sin pedir otra contraseña y los cambios web no reinstalan el contenedor Windows. El adaptador se probó contra HTTP y PostgreSQL aislados; el flujo visual de este publicador aún no se certificó.

Backend y evidencia completos en `C:\tmp\dcarela-migracion-20261120\MIGRACION_API_Y_BLOQUEO_CUOTA_20261120.md`. Servicios y Erick tienen 71 funciones en preparación; 100.380 documentos corresponden al corte de 08:51:13Z del 20/11, no al estado final certificado. No reactivar facturación, importar el parcial ni habilitar escrituras contra datos antiguos.

Después de completar consumidores, reconciliación, autenticación y webhooks/tareas, publicar este parche con versión nueva y probar datos/sucursal/medios. Actualizar la PWA **al final**, respetando Antigravity y el requisito de tarjeta como compromiso/pago vinculado.
