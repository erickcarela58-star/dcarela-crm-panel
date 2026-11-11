// Editor de flyers V4 (ZIP «DCARELA_EDITOR_COMPLETO_PALETA_CRM_V4»): piezas PURAS de la paridad con la primera propuesta.
// Sin DOM: qué superficies deben existir, qué sección del inspector va en cada pestaña, y los planes de cambio que la
// interfaz aplica sobre el formulario REAL del Estudio (un solo paso del historial cada uno). Se prueba en Node.
(function (raiz, fabrica) {
  const X = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = X;
  else raiz.DcarelaEditorV4Core = X;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Lo que el ZIP exige (INVENTARIO_PARIDAD_V4.md, pruebas de aceptación 1–3): 5 pestañas a cada lado, 6 acciones V7, 3 variantes.
  const PARIDAD = Object.freeze({
    izquierda: Object.freeze([['plantillas', 'Plantillas'], ['misdisenos', 'Mis diseños'], ['fotos', 'Fotos'], ['recursos', 'Recursos'], ['marca', 'Marca']]),
    derecha: Object.freeze([['editar', 'Propiedades'], ['capas', 'Capas'], ['estilos', 'Estilos'], ['efectos', 'Efectos'], ['diseno', 'Diseño']]),
    motor: Object.freeze([
      ['generar', 'Generar composición', 'Pide al motor V7 la vista exacta con tu foto y tus textos'],
      ['conservar', 'Conservar diseño', 'Guarda este diseño como punto de restauración'],
      ['recomponer', 'Recomponer', 'Devuelve las capas movidas a donde las coloca el motor'],
      ['adaptar', 'Adaptar formato', 'Revisa el mismo diseño en 4:5, 1:1 y 9:16'],
      ['tipografia', 'Variar tipografía', 'Prueba la siguiente letra del titular'],
      ['referencia', 'Analizar referencia', 'Recrea el flyer a partir de una imagen de referencia'],
    ]),
    variantes: Object.freeze([['imagen_4x5', 'Feed 4:5', '1080 × 1350'], ['imagen_9x16', 'Historia 9:16', '1080 × 1920'], ['imagen_1x1', 'Cuadrado 1:1', '1080 × 1080']]),
  });

  // Herramientas del Estudio que se ofrecen como «Recursos» (cada una es un botón real `data-e238-tool`).
  const RECURSOS = Object.freeze([
    ['textoLibre', 'Texto libre', 'Un texto suelto que mueves donde quieras'],
    ['formas', 'Formas', 'Rectángulos, círculos y líneas'],
    ['degradado', 'Degradado', 'Un degradado sobre la foto'],
    ['logo', 'Logo PNG', 'Tu logo u otro PNG transparente'],
    ['mosaico', 'Mosaico', 'Varias fotos en marcos independientes'],
    ['sujeto', 'Seleccionar sujeto', 'Recorta a la persona sin tocar la foto original'],
    ['efectos', 'Efectos', 'Sombra, contorno y brillo del texto'],
    ['fondo', 'Fondo', 'Color o foto de fondo'],
  ]);

  // Las secciones del panel «Diseño» se reparten entre Estilos, Efectos y Diseño (por su título).
  const SECCION_DE = Object.freeze({ 'Colores': 'estilos', 'Fondo y legibilidad': 'efectos' });
  const pestanaDeSeccion = (titulo) => SECCION_DE[String(titulo || '').trim()] || 'diseno';
  const seccionVisible = (pestana, titulo) => pestanaDeSeccion(titulo) === pestana;

  // Campos tipográficos que Estilos muestra si el formulario los tiene como lista.
  const CAMPOS_TIPO = Object.freeze([['tipografia', 'Letra del titular'], ['tipografia_subtitulo', 'Letra del subtítulo'], ['tipografia_cta', 'Letra del botón'], ['peso_titulo', 'Grosor del titular'], ['tracking_titulo', 'Espaciado del titular']]);

  const texto = (v) => String(v == null ? '' : v);
  // Solo los campos que cambian: si no hay nada que cambiar, el plan sale vacío (y no se gasta un paso del historial).
  function soloCambios(deseados, actuales) {
    const out = {};
    for (const [k, v] of Object.entries(deseados)) if (k in actuales && texto(actuales[k]) !== texto(v)) out[k] = texto(v);
    return out;
  }

  // «Marca»: firma, redes y ciudad del negocio (crm-config.js) visibles en el flyer.
  function planMarca(marca, actuales) {
    const m = marca || {};
    return soloCambios({ marca_texto: m.nombre, redes_texto: m.instagram, ubicacion_texto: m.ciudad, mostrar_marca: 'visible', mostrar_contactos: 'visible' }, actuales || {});
  }
  // «Recomponer»: las capas que el operador desplazó vuelven a 0 (el motor decide de nuevo). Textos, fotos y colores no se tocan.
  function planRecomponer(actuales) {
    const out = {};
    for (const [k, v] of Object.entries(actuales || {})) if (/^d[xy]_(titulo|subtitulo|cta|marca|periodo)$/.test(k) && Number(v || 0) !== 0) out[k] = '0';
    return out;
  }
  // «Variar tipografía»: la siguiente opción de la lista, dando la vuelta. Sin opciones o con una sola, no hay variación.
  function siguienteOpcion(opciones, actual) {
    const ops = (opciones || []).map(texto).filter(Boolean);
    if (ops.length < 2) return null;
    const i = ops.indexOf(texto(actual));
    return ops[(i + 1) % ops.length];
  }
  // Para la autoprueba en pantalla: qué superficies faltan (ids de PARIDAD que no aparecen).
  function faltantes(presentes) {
    const p = new Set(presentes || []), out = [];
    for (const [grupo, lista] of Object.entries(PARIDAD)) for (const [id] of lista) if (!p.has(grupo + ':' + id)) out.push(grupo + ':' + id);
    return out;
  }
  // Puntos conservados de TODAS las plantillas (para «Mis diseños»), del más nuevo al más viejo.
  const ordenaPuntos = (puntos) => [...(puntos || [])].filter((p) => p && p.plantilla && p.valores).sort((a, b) => texto(b.cuando).localeCompare(texto(a.cuando)));

  // ---------- Propuestas con diferencias (el Motor V7 propone, el operador acepta) ----------
  // Lista legible de lo que cambiaría: [{campo, nombre, antes, despues}]. Sin cambios reales → lista vacía.
  const NOMBRES = Object.freeze({ dx_titulo: 'Titular · horizontal', dy_titulo: 'Titular · vertical', dx_subtitulo: 'Subtítulo · horizontal', dy_subtitulo: 'Subtítulo · vertical',
    dx_cta: 'Botón · horizontal', dy_cta: 'Botón · vertical', dx_marca: 'Firma · horizontal', dy_marca: 'Firma · vertical', dx_periodo: 'Etiqueta · horizontal', dy_periodo: 'Etiqueta · vertical',
    tipografia: 'Letra del titular', tipografia_subtitulo: 'Letra del subtítulo', tipografia_cta: 'Letra del botón', marca_texto: 'Nombre del estudio', redes_texto: 'Redes',
    ubicacion_texto: 'Ubicación', mostrar_marca: 'Firma', mostrar_contactos: 'Redes y ubicación', mostrar_whatsapp: 'WhatsApp en el botón', texto: 'Color del titular',
    acento: 'Color de acento y botón', color_subtitulo: 'Color del subtítulo', color_marca: 'Color de la firma', color_panel: 'Color de banda o tarjeta' });
  function diferencias(propuesta, actuales, etiquetas) {
    const out = [];
    for (const [k, v] of Object.entries(propuesta || {})) {
      const antes = texto((actuales || {})[k]);
      if (antes === texto(v)) continue;
      const et = (etiquetas && etiquetas[k]) || {};
      out.push({ campo: k, nombre: NOMBRES[k] || k, antes: et[antes] || antes || '—', despues: et[texto(v)] || texto(v) || '—' });
    }
    return out;
  }

  // ---------- Repartir textos (distribuir con el mismo espacio entre bloques) ----------
  // cajas: las del motor (x, y, w, h en % del lienzo). Se reparten en vertical los bloques de texto presentes (≥3):
  // el primero y el último se quedan; los del medio se mueven para que los huecos sean iguales. Devuelve los nuevos dy.
  // La firma (marca) va aparte, normalmente arriba: repartirla arrastraría el titular hacia la foto. Solo el bloque principal.
  const REPARTIBLES = Object.freeze(['titulo1', 'titulo2', 'zona', 'cta']);
  function calculaReparto(cajas, actuales, campos, tope = 25) {
    const bloques = (cajas || []).filter((c) => REPARTIBLES.includes(c.rol) && campos && campos[c.rol] && Number.isFinite(+c.y) && Number.isFinite(+c.h));
    const unicos = [...new Map(bloques.map((c) => [c.rol, c])).values()].sort((a, b) => a.y - b.y);
    if (unicos.length < 3) return { error: 'Hacen falta al menos tres textos visibles para repartir.' };
    const primero = unicos[0], ultimo = unicos[unicos.length - 1];
    const libre = (ultimo.y + ultimo.h) - primero.y - unicos.reduce((s, c) => s + c.h, 0);
    if (libre < 0) return { error: 'Los textos están montados: sepáralos antes de repartirlos.' };
    const hueco = libre / (unicos.length - 1);
    const cambios = {}; let y = primero.y + primero.h + hueco, limitado = false;
    for (const c of unicos.slice(1, -1)) {
      const k = campos[c.rol][1], actual = Number((actuales || {})[k] || 0), nuevo = Math.round((actual + (y - c.y)) * 10) / 10;
      const acotado = Math.max(-tope, Math.min(tope, nuevo)); if (acotado !== nuevo) limitado = true;
      if (acotado !== actual) cambios[k] = String(acotado);
      y += c.h + hueco;
    }
    return { cambios, hueco: Math.round(hueco * 10) / 10, bloques: unicos.map((c) => c.rol), limitado };
  }

  // ---------- Cuentagotas ----------
  // EyeDropper devuelve «#rrggbb» (o rgb()); los campos de color del Estudio guardan #RRGGBB.
  function normalizaColor(v) {
    const s = texto(v).trim();
    let m = /^#?([0-9a-f]{6})$/i.exec(s); if (m) return '#' + m[1].toUpperCase();
    m = /^#?([0-9a-f]{3})$/i.exec(s); if (m) return '#' + m[1].split('').map((c) => c + c).join('').toUpperCase();
    m = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i.exec(s);
    if (m && [m[1], m[2], m[3]].every((n) => +n <= 255)) return '#' + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, '0')).join('').toUpperCase();
    return null;
  }
  const CAMPOS_COLOR = Object.freeze([['texto', 'Color del titular'], ['acento', 'Color de acento y botón'], ['color_subtitulo', 'Color del subtítulo'], ['color_marca', 'Color de la firma'], ['color_panel', 'Color de banda o tarjeta']]);

  // ---------- Lote de exportación ----------
  // Orden de trabajo: primero el formato actual (ya dibujado), luego los otros; al final se vuelve al de partida.
  function ordenLote(actual, disponibles) {
    const todos = PARIDAD.variantes.map((v) => v[0]).filter((k) => !disponibles || disponibles.includes(k));
    return todos.includes(actual) ? [actual, ...todos.filter((k) => k !== actual)] : todos;
  }
  const nombreLote = (plantilla, formato, fecha) => ('flyer-' + texto(plantilla).replace(/[^a-z0-9-]/gi, '-') + '-' + texto(formato).replace('imagen_', '') + '-' + texto(fecha).slice(0, 10)).toLowerCase();

  // ---------- Preferencias por usuario (servidor) ----------
  // Solo se guardan claves conocidas y pequeñas: nunca el diseño ni datos del negocio.
  // Forma del registro de herramientas (editor2-tools-core: getPreferences) + «proponer» del Motor V7.
  const PREFS_CLAVES = Object.freeze(['orderedIds', 'hiddenIds', 'pinnedIds', 'shortcutOverrides', 'perfil', 'proponer']);
  const idValido = (x) => typeof x === 'string' && /^[\w.-]{1,60}$/.test(x);
  function limpiaPrefs(p) {
    const out = {};
    for (const k of PREFS_CLAVES) {
      const v = (p || {})[k]; if (v === undefined || v === null) continue;
      if (Array.isArray(v)) out[k] = v.filter(idValido).slice(0, 120);
      else if (k === 'shortcutOverrides' && typeof v === 'object') out[k] = Object.fromEntries(Object.entries(v).filter(([id, c]) => idValido(id) && typeof c === 'string' && c.length <= 30).slice(0, 60));
      else if (k === 'perfil' && typeof v === 'string' && /^[a-z]{2,20}$/.test(v)) out[k] = v;
      else if (k === 'proponer' && typeof v === 'boolean') out[k] = v;
    }
    return out;
  }

  return { PARIDAD, RECURSOS, CAMPOS_TIPO, CAMPOS_COLOR, pestanaDeSeccion, seccionVisible, planMarca, planRecomponer, siguienteOpcion, faltantes, ordenaPuntos,
    diferencias, calculaReparto, normalizaColor, ordenLote, nombreLote, PREFS_CLAVES, limpiaPrefs };
});
