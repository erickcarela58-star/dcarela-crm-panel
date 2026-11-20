# Parche de nube local preparado, sin publicar

Esta rama prepara exclusivamente el transporte del CRM v468 vigente hacia la API local. Conserva la galería y sus botones. **No fusionar ni publicar antes del corte conciliado**: la entrada `https://dcarela-api.dcarela-compufoto.workers.dev` todavía está cerrada a tráfico productivo y la reconciliación final de Firestore falló por cuota HTTP429.

Cambios: import-map en `index.html`/`v2.html`, URLs en `crm-config.js`, adaptadores en `nube-sdk/`. Las sesiones se pueden intercambiar sin pedir otra contraseña y los cambios web no reinstalan el contenedor Windows. El adaptador se probó contra HTTP y PostgreSQL aislados; el flujo visual de este publicador aún no se certificó.

Backend y evidencia completos en `C:\tmp\dcarela-migracion-20261120\MIGRACION_API_Y_BLOQUEO_CUOTA_20261120.md`. Servicios y Erick tienen 71 funciones en preparación; 100.380 documentos corresponden al corte de 08:51:13Z del 20/11, no al estado final certificado. No reactivar facturación, importar el parcial ni habilitar escrituras contra datos antiguos.

Después de completar consumidores, reconciliación, autenticación y webhooks/tareas, publicar este parche con versión nueva y probar datos/sucursal/medios. Actualizar la PWA **al final**, respetando Antigravity y el requisito de tarjeta como compromiso/pago vinculado.
