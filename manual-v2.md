# CRM D' Carela — manual de uso

Versión v139 (29/09/2026). Lo nuevo de esta versión: **Hoy**, **Funnel en embudo**, **Configuración en secciones**, el **agente de marketing**, los **leads al día** y el asistente de WhatsApp con el CRM. **Hoy** ya no lista lo resuelto (un «ok» o «perfecto» tras 2 días, lo que cerramos nosotros con «de nada»); y todas las confirmaciones salen dentro de la página. Los **proveedores y vendedores** ya no aparecen como clientes: el CRM lee la conversación y los descarta solo (Configuración → Leads al día; se deshace desde la ficha con «Dejar de ignorar»). El CRM también **identifica el servicio** de cada chat: quien pide sublimación, marcos, diseño, papelería o impresión queda con la etiqueta `cliente_otro_servicio` y, si lo activas (Configuración → Clientes de otros servicios), se le pregunta una vez si quiere promociones de sesiones de fotos; con un «SÍ» el agente de marketing propone llevarlo a la fotografía. **Tareas** (antes «Recordatorios»): tú y tu equipo se ponen tareas por WhatsApp, dentro del horario de cada quien, con preguntas de seguimiento acotadas (Tareas → Equipo y horarios para añadir números).

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

### Agente de marketing

Arriba de Campañas, el agente analiza tus conversaciones y ventas cada mañana (8:20) y **propone** campañas con cifras reales.
No envía nada: **Preparar** deja el formulario armado y ahí se simula. Cada propuesta enseña:

- **Reparto por línea**: número oficial (con cuántos están dentro de las 24 h y cuántos necesitan plantilla) y el segundo número (5644).
  **Preparar por el 5644** arma la campaña de esa línea (texto libre, con ritmo; solo se simula desde la API, el envío sale por el puente).
- **Quién queda fuera y por qué**: quien dijo que no, reclamó, está con una persona, vino por documentos o ya recibió marketing hace
  poco no entra. Al simular y al enviar se respeta.
- **Plantillas de Meta**: si la campaña necesita una y no existe, propone el borrador (con la salida STOP). **Enviar a Meta** la manda a
  revisión; hasta que Meta la apruebe no se puede usar.
- **Conversaciones que conviene descartar** (dijeron que no, escribieron por error, publicidad, más de 90 días sin escribir y nunca
  compraron): **Descartar** las pasa a desinteresado, **Mantener** no las vuelve a sugerir en 30 días. Nunca se sugieren clientes.

Ojo con el permiso de marketing: casi nadie lo tiene, así que una campaña de tipo *marketing* llega a muy pocos. Los seguimientos
y los Estados alcanzan a más gente.

Las propuestas también llegan a tu WhatsApp, numeradas como en el panel (ver «Asistente de WhatsApp»).

### Simular y enviar

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

## Hoy — lo que toca atender

La pantalla **Hoy** ordena el día por importancia y **no envía nada**:

- **Sin responder**: chats donde el último mensaje es del cliente. Ojo, no es lo mismo que «sin leer»: un chat
  puede estar leído en el teléfono y seguir sin contestar. Un «gracias», una bendición o un emoji suelto no cuenta;
  «ok», «dale», «sí» y los saludos sí. Primero reservas y cotizaciones, luego lo más antiguo.
- **Se enfrían**: les escribiste tú, no han contestado (2 a 21 días) y no hay seguimiento puesto.
- **Seguimientos** de hoy y vencidos, y **sesiones** de hoy y mañana.

Cada fila se abre con un clic. **No requiere respuesta** lo saca de la lista hasta que el cliente escriba otra vez.
**Recordarme** abre el recordatorio de siempre. El número del menú suma lo de hoy, lo atrasado y los seguimientos.

Cada mañana a las 8:45 llega lo mismo a tu WhatsApp («Tu día en el CRM»), solo si hay algo que atender. Se apaga en
Configuración > Mensajería > Avisos para ti.

---

## Leads al día

El estado de cada lead se corrige solo (8:05, 11:05, 14:05, 17:05 y 20:05), sin enviar nada a nadie:

- Quien pedía **una persona** y ya recibió respuesta tuya deja de figurar como pendiente. Un seguimiento automático o
  una respuesta del bot no cuentan como haber contestado.
- Un chat **sin leer** cuyo último mensaje es tuyo se marca leído.
- Quien **compró en caja** pasa a cliente; quien tiene una **sesión por venir**, a reservado.
- **Cierre por silencio**: tras 14 días sin contestar (30 si esperaba el abono) pasa a perdido. Nunca a un cliente.
  Si vuelve a escribir, **se reabre solo** en su etapa anterior. Se apaga con «Auto-cierre».
- Quien dice «no me interesa» o «dejen de escribirme» pasa a desinteresado: sin seguimientos ni marketing.

Cada ficha guarda qué regla la cambió. En Configuración > Automatización e IA, **Ver qué cambiaría** cuenta sin tocar
nada y **Ponerlos al día ahora** aplica. Por WhatsApp: «leads al día».

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
| **Hoy** | La cola de trabajo: sin responder, se enfrían, seguimientos y sesiones. Ver arriba. |
| **Funnel** | Vista de **embudo**: cada etapa con su cifra y, debajo, la gente de la etapa elegida con **Mover a…** (o arrastrando sobre la etapa). El interruptor **Tablero** devuelve las columnas. Buscador, filtros y reorganizar. Abajo, **leads parados**. |
| **Agenda** | Calendario mensual y `＋ Agendar`. Confirmada reserva el hueco; tentativa no. |
| **Plantillas** | Sincroniza con Meta y crea las tuyas. **Meta las revisa antes de poder usarse** — no cuentes con una nueva para hoy. |
| **Recordatorios** | Seguimientos con fecha. Los vencidos primero. |
| **Canales** | Estado real de cada vía. Si uno no está en verde, lo que escribas por ahí **no llega**. Aquí se enciende y apaga el bot **por canal**. |
| **Configuración** | Cuentas del equipo y los interruptores del negocio, en cinco categorías con secciones y explicación; los textos largos se pliegan en «Más detalles». El buscador mira todas. |
| Prospección · Clientes de caja · Satisfacción | Listados. Cada uno explica qué lo llena si está vacío. |

---

## Asistente de WhatsApp (tu número de dueño)

Además de finanzas, entiende el CRM. Las confirmaciones de gasto, ingreso o transferencia salen como una imagen con letra grande.
Órdenes (nada de esto le escribe a un cliente):

| Escribe | Qué hace |
|---|---|
| `mi día` · `sin responder` · `se enfrían` · `seguimientos` | La cola de trabajo |
| `sin leer` · `embudo` · `leads de hoy` · `cotizando` · `busca María` · `cómo va el CRM` | Consultas del CRM |
| `propuestas` · `detalle 2` · `preparar 2` · `descartar 2` | El agente de marketing (los números son los del panel) |
| `crear 3` | Manda a revisión de Meta una plantilla propuesta |
| `descartes` · `descartar chat 1` · `mantener chat 1` · `descartar chats` (pide `confirmo descartar chats`) | Conversaciones que conviene descartar |
| `leads al día` | Corrige ya los estados |
| `ayuda crm` | La lista completa |

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
