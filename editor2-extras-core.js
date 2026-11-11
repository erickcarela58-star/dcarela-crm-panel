// Editor 2.0 · Etapa B — lógica pura (sin DOM) de las funciones nuevas del Estudio:
//  · Revisión antes de exportar (QA): lee las cajas que el motor V7 dibujó de verdad y avisa de lo que un cliente notaría.
//  · Puntos de restauración («Conservar diseño»): copias con nombre de los valores del flyer, fuera del historial de deshacer.
//  · Siguiente plantilla de la misma serie («Variar plantilla»).
// Nada de esto simula al motor: trabaja con lo que el editor real ya entrega (`ultimoMotor`, `valores`, `lista`).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DcarelaEditor2ExtrasCore = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const NOMBRE_ROL = { titulo1: 'El titular', titulo2: 'La segunda línea del titular', marca: 'La firma', zona: 'La línea de apoyo', cta: 'La llamada a escribir', periodo: 'La etiqueta' };
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const choca = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // Márgenes seguros en % del lienzo. En historia (9:16) arriba va el nombre de la cuenta y abajo la caja de responder.
  function margenes(ancho, alto) {
    const historia = alto / ancho > 1.6;
    return { lado: 4, arriba: historia ? 11 : 3, abajo: historia ? 11 : 3, historia };
  }

  // `cajas`: [{rol, x, y, w, h, size, texto}] en % del lienzo (size en % del ancho), tal cual las entrega el motor.
  // Devuelve [{nivel: 'error'|'aviso'|'bien', texto, rol?}], lo grave primero.
  function revisa({ cajas, ancho = 1080, alto = 1350, fotos = [] } = {}) {
    const lista = (Array.isArray(cajas) ? cajas : []).filter((c) => c && c.rol && String(c.texto || '').trim())
      .map((c) => ({ rol: c.rol, x: num(c.x), y: num(c.y), w: num(c.w), h: num(c.h), size: num(c.size), texto: String(c.texto) }));
    const salida = [], m = margenes(ancho, alto);
    if (!lista.length) return [{ nivel: 'error', texto: 'Todavía no hay una vista compuesta por el motor. Espera a que termine o elige una foto.' }];
    if (!fotos.length) salida.push({ nivel: 'error', texto: 'El flyer no tiene foto elegida.' });
    if (!lista.some((c) => c.rol === 'titulo1')) salida.push({ nivel: 'error', texto: 'Falta el titular.' });
    for (const c of lista) {
      const n = NOMBRE_ROL[c.rol] || c.rol;
      if (c.x < m.lado - .05 || c.x + c.w > 100 - m.lado + .05) salida.push({ nivel: 'aviso', rol: c.rol, texto: n + ' queda muy pegada al borde lateral (menos de ' + m.lado + ' % de margen).' });
      if (c.y < m.arriba - .05) salida.push({ nivel: 'aviso', rol: c.rol, texto: n + (m.historia ? ' cae en la franja de arriba de la historia, donde va el nombre de la cuenta.' : ' queda muy pegada al borde de arriba.') });
      if (c.y + c.h > 100 - m.abajo + .05) salida.push({ nivel: 'aviso', rol: c.rol, texto: n + (m.historia ? ' cae en la franja de abajo de la historia, donde va la caja de responder.' : ' queda muy pegada al borde de abajo.') });
      // Letra menor de ~15 px en un lienzo de 1080: en el teléfono no se lee.
      const px = c.size * 10.8;
      if (px && px < 15) salida.push({ nivel: 'aviso', rol: c.rol, texto: n + ' sale con letra de ' + Math.round(px) + ' px: en el teléfono casi no se lee.' });
    }
    for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) {
      if (choca(lista[i], lista[j])) salida.push({ nivel: 'error', rol: lista[i].rol, texto: (NOMBRE_ROL[lista[i].rol] || lista[i].rol) + ' se monta sobre ' + (NOMBRE_ROL[lista[j].rol] || lista[j].rol).toLowerCase() + '.' });
    }
    const titular = lista.filter((c) => c.rol === 'titulo1' || c.rol === 'titulo2').map((c) => c.texto).join(' ').replace(/\s+/g, ' ');
    if (titular.length > 70) salida.push({ nivel: 'aviso', rol: 'titulo1', texto: 'El titular tiene ' + titular.length + ' letras. En anuncios funciona mejor con menos de 70.' });
    // Regla práctica para anuncios: poco texto sobre la imagen. Se mide el área real de las cajas.
    const area = lista.reduce((s, c) => s + c.w * c.h, 0) / 100;
    if (area > 20) salida.push({ nivel: 'aviso', texto: 'El texto ocupa cerca del ' + Math.round(area) + ' % de la imagen. Para anuncios conviene quedarse por debajo del 20 %.' });
    if (!lista.some((c) => c.rol === 'cta')) salida.push({ nivel: 'aviso', texto: 'No hay llamada a escribir visible (sirve si el botón lo pone el anuncio).' });
    if (!salida.length) return [{ nivel: 'bien', texto: 'Sin problemas: márgenes, tamaños de letra y textos en orden (' + lista.length + ' rótulos revisados).' }];
    const orden = { error: 0, aviso: 1, bien: 2 };
    return salida.sort((a, b) => orden[a.nivel] - orden[b.nivel]);
  }
  const resumen = (r) => ({ errores: r.filter((x) => x.nivel === 'error').length, avisos: r.filter((x) => x.nivel === 'aviso').length });

  // ---- puntos de restauración ----
  const soloEditables = (valores) => Object.fromEntries(Object.entries(valores || {}).filter(([k, v]) => !k.startsWith('_') && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')));
  function diferencias(a, b) {
    const x = soloEditables(a), y = soloEditables(b);
    return [...new Set([...Object.keys(x), ...Object.keys(y)])].filter((k) => String(x[k] ?? '') !== String(y[k] ?? ''));
  }
  // Añade un punto (el más nuevo primero), sin duplicar uno idéntico al último y con tope de `max` por plantilla.
  function agregaPunto(lista, { plantilla, nombre, valores, cuando }, max = 8) {
    const limpio = { plantilla: String(plantilla || ''), nombre: String(nombre || '').trim().slice(0, 40) || 'Punto', valores: soloEditables(valores), cuando: cuando || new Date().toISOString() };
    const previos = (Array.isArray(lista) ? lista : []).filter((p) => p && p.plantilla);
    const ultimo = previos.find((p) => p.plantilla === limpio.plantilla);
    if (ultimo && !diferencias(ultimo.valores, limpio.valores).length) return Array.isArray(lista) ? lista : previos;
    const mios = previos.filter((p) => p.plantilla === limpio.plantilla).slice(0, max - 1), otros = previos.filter((p) => p.plantilla !== limpio.plantilla);
    return [limpio, ...mios, ...otros].slice(0, 60);
  }
  const puntosDe = (lista, plantilla) => (Array.isArray(lista) ? lista : []).filter((p) => p && p.plantilla === plantilla);

  // ---- Alinear la capa activa al lienzo (V4 del kit: «Alinear y distribuir») ----
  // El Estudio mueve cada rótulo con campos de desplazamiento en % del lienzo (`dx_*` del ancho, `dy_*` del alto, entre −25 y 25). La caja que dibujó el motor ya incluye el
  // desplazamiento actual, así que lo que falta para llegar al destino se SUMA al que hay. El subtítulo hereda el del titular: basta con ajustar el suyo.
  const CAMPOS_ALINEA = Object.freeze({ titulo1: ['dx_titulo', 'dy_titulo'], titulo2: ['dx_subtitulo', 'dy_subtitulo'], cta: ['dx_cta', 'dy_cta'], marca: ['dx_marca', 'dy_marca'], periodo: ['dx_periodo', 'dy_periodo'], zona: ['dx_periodo', 'dy_periodo'] });
  const CAPA_A_ROL = Object.freeze({ titulo: 'titulo1', subtitulo: 'titulo2', cta: 'cta', marca: 'marca', periodo: 'periodo' });
  const DESTINOS = Object.freeze(['izquierda', 'centro', 'derecha', 'arriba', 'medio', 'abajo']);
  const redondea = (v) => Math.round(v * 10) / 10;
  // `caja` {x,y,w,h} en % del lienzo; `actual` {dx,dy}; `margen` de margenes(). Devuelve {dx,dy,limitado} con SOLO el eje que se pidió cambiado.
  function calculaAlineacion({ caja, destino, actual = {}, margen } = {}) {
    if (!caja || !DESTINOS.includes(destino)) return null;
    // El motor no deja texto a menos de 6 % del borde (12 % arriba y abajo en historias): se alinea a SU zona segura, que es más estricta que la de la revisión.
    const base = margen || margenes(1080, 1350), m = { lado: Math.max(base.lado, 6), arriba: Math.max(base.arriba, base.historia ? 12 : 6), abajo: Math.max(base.abajo, base.historia ? 12 : 6) };
    const dx0 = num(actual.dx), dy0 = num(actual.dy);
    let objetivoX = null, objetivoY = null;
    if (destino === 'izquierda') objetivoX = m.lado; else if (destino === 'derecha') objetivoX = 100 - m.lado - num(caja.w); else if (destino === 'centro') objetivoX = 50 - num(caja.w) / 2;
    if (destino === 'arriba') objetivoY = m.arriba; else if (destino === 'abajo') objetivoY = 100 - m.abajo - num(caja.h); else if (destino === 'medio') objetivoY = 50 - num(caja.h) / 2;
    const fija = (v) => { const c = Math.max(-25, Math.min(25, redondea(v))); return { v: c, lim: c !== redondea(v) }; };
    const X = objetivoX === null ? { v: dx0, lim: false } : fija(dx0 + objetivoX - num(caja.x));
    const Y = objetivoY === null ? { v: dy0, lim: false } : fija(dy0 + objetivoY - num(caja.y));
    return { dx: X.v, dy: Y.v, limitado: X.lim || Y.lim };
  }

  // ---- «Mis diseños»: guardar y abrir un diseño como archivo (V4 del kit: importación/exportación JSON) ----
  // El archivo lleva la plantilla y los ajustes editables (los mismos que los puntos de restauración); NO lleva fotos ni claves, solo el diseño.
  const VERSION_ARCHIVO = 1;
  function armaArchivo({ plantilla, formato, valores, ahora } = {}) {
    return { tipo: 'dcarela-diseno', version: VERSION_ARCHIVO, plantilla: String(plantilla || ''), formato: String(formato || ''), guardado: ahora || new Date().toISOString(), valores: soloEditables(valores) };
  }
  function leeArchivo(texto) {
    let j; try { j = JSON.parse(String(texto || '')); } catch (_) { return { ok: false, error: 'No se pudo leer el archivo: no es un diseño válido.' }; }
    if (!j || typeof j !== 'object' || j.tipo !== 'dcarela-diseno') return { ok: false, error: 'Ese archivo no es un diseño de D\' Carela.' };
    if (j.version !== VERSION_ARCHIVO) return { ok: false, error: 'Ese diseño es de otra versión y no se puede abrir.' };
    if (!/^[a-z0-9_-]{1,80}$/i.test(String(j.plantilla || '')) || !j.valores || typeof j.valores !== 'object' || Array.isArray(j.valores)) return { ok: false, error: 'El archivo del diseño está incompleto.' };
    return { ok: true, plantilla: String(j.plantilla), formato: String(j.formato || ''), valores: soloEditables(j.valores) };
  }
  const nombreArchivo = (plantilla, ahora) => 'diseno-' + String(plantilla || 'flyer').replace(/[^a-z0-9_-]/gi, '-').slice(0, 40) + '-' + String(ahora || new Date().toISOString()).slice(0, 10) + '.json';

  // ---- variar plantilla ----
  // `lista`: [[id, numero, nombre, color], …] del editor. Devuelve la siguiente de la MISMA serie (pautas con pautas, editoriales con editoriales).
  const serieDe = (id) => (/^v9-pauta/.test(id) ? 'pauta' : /^v9-/.test(id) ? 'v9' : /mosaico/.test(id) ? 'mosaico' : 'v6');
  function siguientePlantilla(lista, actual) {
    const ids = (Array.isArray(lista) ? lista : []).map((f) => (Array.isArray(f) ? f[0] : f && f.id)).filter(Boolean);
    const serie = ids.filter((id) => serieDe(id) === serieDe(actual || ''));
    if (serie.length < 2) return null;
    const i = serie.indexOf(actual);
    return serie[(i + 1) % serie.length];
  }
  return { revisa, resumen, margenes, diferencias, agregaPunto, puntosDe, siguientePlantilla, serieDe, soloEditables, NOMBRE_ROL, armaArchivo, leeArchivo, nombreArchivo, VERSION_ARCHIVO, calculaAlineacion, CAMPOS_ALINEA, CAPA_A_ROL, DESTINOS };
});
