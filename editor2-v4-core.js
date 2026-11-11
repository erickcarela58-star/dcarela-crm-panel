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

  return { PARIDAD, RECURSOS, CAMPOS_TIPO, pestanaDeSeccion, seccionVisible, planMarca, planRecomponer, siguienteOpcion, faltantes, ordenaPuntos };
});
