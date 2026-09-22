# CRM D' Carela — manual de uso

Versión v109, publicada el 20/09/2026 (UTC).

Central: `https://crm.dcarelacompufoto.com/` · Fotos: `https://fotos.dcarelacompufoto.com/`.
La página principal y `/v2.html` muestran ahora el mismo panel. El anterior no es un
respaldo público vigente. Guía rápida: `manual-v2.html`.

---

## Lo primero: cómo está pensado

Tres ideas que explican casi todas las decisiones del panel:

**El asistente propone; tú apruebas.** Un borrador se deja escrito en el compositor,
nunca se envía por el mero hecho de generarlo. Los bots y automatizaciones que un
administrador haya habilitado conservan sus propias reglas; revisar Canales y
Configuración antes de programar campañas.

**El canal decide por dónde sale cada mensaje.** Un chat que entró por WhatsApp Web no
puede salir por el número oficial, y al revés. El panel lo enruta; si te equivocas de
canal te lo dice antes de intentarlo.

**Proteger el número está por encima de enviar más.** Si Meta degrada la calidad de tu
número, la penalización tarda semanas en irse y no hay a quién reclamar. Por eso hay
tope diario, ritmo de envío, corte automático y personalización obligatoria.

---

## Conversaciones

La pantalla donde vas a estar casi todo el tiempo.

**Los filtros** de arriba se arrastran con el ratón si no caben. Además de los fijos
(Todos, Sin leer, Humano, Bot) aparecen uno por canal y uno por cada etiqueta que uses.

**El distintivo de color** junto a la foto dice por dónde escribe: verde WhatsApp
oficial, azul WhatsApp Web, morado Instagram, rombo Messenger.

**Abrir un chat lo marca como leído.** El contador baja solo.

### El compositor

De izquierda a derecha: imagen · HD · documento · respuestas rápidas · combos ·
plantillas · micrófono.

- **HD** se puede pulsar *antes o después* de adjuntar: recomprime lo que ya esté puesto
  y la miniatura te enseña el peso final. Sirve para que la foto llegue en la máxima
  calidad que WhatsApp entrega **de verdad** — más resolución no mejora nada y hace
  fallar el envío.
- **Combos** lee el catálogo de tu web, así que el precio que mandas es siempre el que
  ve el cliente. Adjunta la tarjeta oficial y redacta el texto.
- **Plantillas** es lo único que llega cuando han pasado más de 24 h desde el último
  mensaje del cliente.
- **Micrófono**: al grabar ves la onda real. Si se queda plana, no está entrando sonido
  — no envíes.

### Sobre un mensaje

Pasa el ratón por encima y pulsa `⌄`: responder citando, reenviar, copiar, borrar.
Borrar lo oculta **solo de aquí**; el cliente lo sigue viendo en su teléfono.

### Menú `⋯` de la conversación

**Añadir recordatorio** (con atajos: 4 h, mañana, 3 días, una semana), **enviar
encuesta** y **cerrar conversación**.

> Al enviar la encuesta, **elige quién atendió**. Si no lo eliges, esa opinión no cuenta
> para nadie en el ranking del equipo, y eso no se puede arreglar después.

### Seleccionar varios

Pasa el ratón por una fila y aparece una casilla. Con varias marcadas puedes etiquetar,
marcar desinteresados, o apagar bot y marketing. Lo último pide escribir `APAGAR <n>`
con el número, para que no valga darle a intro por costumbre.

---

## Planificación — el asistente

Es un chat. Le escribes lo que necesitas y propone; **no toca nada hasta que apruebas**.

Lee la conversación que tengas abierta, la ficha del contacto y las reglas del negocio.
Recuerda lo hablado entre sesiones, así que puedes decir «y ahora hazlo con el de
arriba».

**Le puedes mandar imágenes**: un comprobante de pago, la foto de un vestido, la captura
de otra cotización.

**Reglas del negocio** (botón arriba a la derecha): lo que no está en ninguna ficha.
Cómo se cobra, qué no se promete, qué fechas están cerradas, cómo se habla. Se le da en
cada propuesta.

**Los seis atajos** de la pantalla inicial son recetas completas, no frases sueltas: ya
llevan escritas las condiciones (un solo acercamiento, no insistir a quien no contesta,
personalizar, programar en vez de disparar).

Cuando propone acciones, ves **los campos exactos** que se van a escribir antes de
aprobar. Y un turno ya aplicado se queda marcado, para que al releerlo mañana no se
aplique dos veces.

---

## Campañas

**Primero simula.** Verás cuántos contactos, cuáles y por qué se excluyeron otros. Solo
después puedes enviar, y se envía **sobre esos ids**, no sobre una audiencia recalculada.

Lo que hace por ti sin que lo pidas:

- **Cada mensaje se personaliza.** Mandar el mismo texto a doscientas personas es lo
  primero que Meta marca como spam.
- **Doce por minuto**, no en ráfaga.
- **Corta a los cinco fallos seguidos.** Seguir mandando mientras Meta rechaza es lo que
  convierte un problema puntual en semanas de penalización.
- Te avisa si es una hora en la que la gente reporta más, o si pasas del tope diario.

En modo plantilla solo se ofrecen las aprobadas **que incluyen salida de baja**. Sin eso
Meta degrada el número.

---

## Limpieza

Contactos dormidos más de 60 días. Se separan en dos:

- Quien **ya recibió dos seguimientos** sin contestar → desinteresado, directo.
- El resto → **un acercamiento. Uno.** Personalizado y **programado para mañana a las
  10:00**, que aparece en Recordatorios para revisarlo antes de enviarlo.

El segundo número queda fuera. Los dormidos no cuentan en las métricas del Dashboard.

---

## Las demás pantallas

| Pantalla | Para qué |
|---|---|
| **Dashboard** | Lo que hay ahora. Las cifras son botones: llevan a verlas con el filtro puesto. El embudo dice **dónde** se pierde la gente. |
| **Funnel** | Arrastra una tarjeta para cambiar de etapa. Abajo, **leads parados** con el motivo y qué hacer. |
| **Agenda** | Calendario mensual y `＋ Agendar`. Confirmada reserva el hueco; tentativa no. |
| **Plantillas** | Sincroniza con Meta y crea las tuyas. **Meta las revisa antes de poder usarse** — no cuentes con una nueva para hoy. |
| **Recordatorios** | Seguimientos con fecha. Los vencidos primero. |
| **Canales** | Estado real de cada vía. Si uno no está en verde, lo que escribas por ahí **no llega**. Aquí se enciende y apaga el bot **por canal**. |
| **Configuración** | Cuentas del equipo y los interruptores del negocio. |
| Prospección · Clientes de caja · Satisfacción | Listados. Cada uno explica qué lo llena si está vacío. |

---

## Cuando algo falla

El panel traduce los errores de Meta a lo que hay que hacer. Los que más verás:

| Dice | Significa |
|---|---|
| Pasaron más de 24 h | El panel te avisa en ámbar sobre el cuadro de escribir y te ofrece **Usar plantilla**. Si escribes igual, te pregunta antes: fuera de la ventana WhatsApp acepta el mensaje y lo marca ⚠ después, así que parece enviado y no lo es. |
| Un chat de WhatsApp Web desapareció | Es de una línea que no está viva: otro número que ya no está vinculado, o la PC del puente sin responder. Por ahí no entra ni sale nada. No se borró — el filtro **WA Web 809-… · desvinculado** (o **· inactivo**) los trae de vuelta, y si ese número se vuelve a vincular vuelven solos a la lista. Al abrirlo, el compositor dice por qué no se puede escribir. |
| No me deja escribir en un chat de WhatsApp Web | Arriba del cuadro de texto está la causa: línea desvinculada, puente sin vincular, PC sin responder o envíos en pausa (con su motivo). Si es pausa, **Reanudar envíos** (lo puede hacer un administrador). |
| Este chat entró por otro canal | Se está enviando por la vía equivocada. Mira Canales. |
| El segundo WhatsApp no está conectado | Conéctalo en Canales. |
| Lleva dos seguimientos sin responder | Quedó como desinteresado. No se le insiste más. |
| Meta está limitando este número | Revisa Canales. **Para de enviar.** |

**Si un mensaje sale con ⚠ en vez de ✓**, Meta lo rechazó. No es que tarde: no llegó.

---

## Lo que este panel NO hace, a propósito

- **No enciende el bot al actualizar.** Conserva la decisión guardada por canal.
  En la comprobación del 20/09/2026, Fotos estaba apagado y el oficial encendido;
  eso es una lectura de ese momento, no una promesa sobre su estado futuro.
- **No publica Estados de WhatsApp.** No existe forma oficial; lo que promete
  automatizarlo usa métodos que **banean el número**.
- **Generar una propuesta no la ejecuta.** Revisa el alcance y los destinatarios al
  aprobar. Un envío ya autorizado y programado puede ser procesado por la cola.

## Límites y verificaciones pendientes

- **Historial antiguo de WhatsApp Web**: la sesión actual es `legacy_web`. No se ha
  cerrado ni desvinculado para forzar una importación. Recuperar todo lo que el teléfono
  no entrega puede requerir volver a vincularlo desde Canales con el teléfono presente.
- **Foto de perfil**: Cloud conserva las iniciales si no hay foto disponible. El puente
  de WhatsApp Web sí tiene recuperación de fotos, sujeta a disponibilidad y límites.
- **Instagram, Facebook, archivos y métricas** tienen implementación en servidor y
  panel; no son funciones «sin empezar». Su entrega real depende de las credenciales,
  permisos y restricciones del canal. Esta entrega no envió mensajes de prueba.
- **Prueba en sesión real**: las pruebas automatizadas, los archivos publicados y el
  proveedor Google fueron comprobados; no sustituyen verificar cada pantalla y cada
  rol desde una sesión autenticada en navegador.
