(function (root, factory) {
  const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.DcarelaSmart = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // Motor de mosaicos tipo Smart Albums (dueño 25/10/2026, propuesta 14 §4.3 y §7). La clave: los marcos se calculan con la
  // PROPORCIÓN REAL de cada foto, así cada original llena su marco entera, sin recorte ni aire (el catálogo anterior repartía
  // casillas iguales y metía la foto «completa» dentro, dejando huecos). Respeta una zona para el texto (abajo, arriba o ninguna),
  // el espacio entre fotos y el margen. La primera foto es la principal: las distribuciones la hacen la más grande.
  // Puro: recibe proporciones (ancho/alto de cada original) y devuelve marcos en % del lienzo. El servidor dibuja igual
  // (contenido-collage + ajuste 'completa'); la familia «Clásicos» rellena casillas con recorte automático.
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const ZONAS = ['abajo', 'arriba', 'ninguna'];
  const POLAROID = { borde: { grosor: 1.1, color: '#FFFFFF' }, sombra: 0.75, radio: 0.6 };
  const GIROS = [-5, 4, -3, 6, -4, 3, -6, 5, -2];

  function opcionesDe(o = {}) {
    const n = (v, lo, hi, d) => { const x = Number(v); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; };
    return { zona: ZONAS.includes(o.zona) ? o.zona : 'abajo', espacio: n(o.espacio, 0, 5, 1.5), margen: n(o.margen, 0, 10, 4), alto_zona: n(o.alto_zona, 12, 40, 26) };
  }

  // Lienzo virtual: ancho A·1000 × alto 1000 (A = ancho/alto). El área útil descuenta margen y zona de texto.
  function area(A, op) {
    const W = A * 1000, H = 1000, m = op.margen / 100 * W, g = op.espacio / 100 * W, z = op.zona === 'ninguna' ? 0 : op.alto_zona / 100 * H;
    return { W, H, g, x: m, y: m + (op.zona === 'arriba' ? z : 0), w: W - 2 * m, h: H - 2 * m - z };
  }
  const aPorc = (W, H, f) => ({ x: r3(f.x / W * 100), y: r3(f.y / H * 100), w: r3(f.w / W * 100), h: r3(f.h / H * 100) });

  // Todas las formas de partir n fotos EN ORDEN en grupos consecutivos (n ≤ 9: como mucho 256).
  function particiones(n, maxGrupos = 4) {
    const out = [];
    for (let mask = 0; mask < 1 << (n - 1); mask++) {
      const g = []; let c = 1;
      for (let i = 0; i < n - 1; i++) { if (mask & (1 << i)) { g.push(c); c = 1; } else c++; }
      g.push(c); if (g.length <= maxGrupos) out.push(g);
    }
    return out;
  }

  // Filas justificadas dentro de una caja: cada fila llena el ancho con sus fotos a la misma altura; si no cabe en alto, todo
  // se reduce por igual y se centra. Devuelve los marcos en px del lienzo virtual.
  function filas(props, grupos, caja, g) {
    let i = 0; const altos = grupos.map((c) => { const s = props.slice(i, i + c).reduce((a, b) => a + b, 0); i += c; return (caja.w - g * (c - 1)) / s; });
    const total = altos.reduce((a, b) => a + b, 0) + g * (grupos.length - 1);
    const s = total > caja.h ? (caja.h - g * (grupos.length - 1)) / (total - g * (grupos.length - 1)) : 1;
    const usado = altos.reduce((a, b) => a + b, 0) * s + g * (grupos.length - 1);
    let y = caja.y + (caja.h - usado) / 2; i = 0; const marcos = [];
    grupos.forEach((c, j) => {
      const h = altos[j] * s, ws = props.slice(i, i + c).map((r) => r * h), anchoFila = ws.reduce((a, b) => a + b, 0) + g * (c - 1);
      let x = caja.x + (caja.w - anchoFila) / 2;
      ws.forEach((w) => { marcos.push({ x, y, w, h }); x += w + g; }); y += h + g; i += c;
    });
    return marcos;
  }
  // Columnas justificadas: lo mismo girado (cada columna llena el alto).
  function columnas(props, grupos, caja, g) {
    const inv = props.map((r) => 1 / r);
    return filas(inv, grupos, { x: caja.y, y: caja.x, w: caja.h, h: caja.w }, g).map((f) => ({ x: f.y, y: f.x, w: f.h, h: f.w }));
  }
  // Qué tan buena es una distribución: ocupa el área, no deja fotos diminutas y la principal es de las grandes.
  function puntaje(marcos, caja) {
    const areas = marcos.map((f) => f.w * f.h), suma = areas.reduce((a, b) => a + b, 0), max = Math.max(...areas), min = Math.min(...areas);
    // Llenar pesa más que igualar tamaños: una fila de 3 retratos en 4:5 dejaba medio lienzo vacío.
    // La principal (primera) tiene que ser de las grandes: si no, la distribución queda atrás.
    return suma / (caja.w * caja.h) - 0.08 * (1 - Math.sqrt(min / max)) - (areas[0] < max * 0.9 ? 0.15 : 0);
  }
  const mejores = (props, caja, g, fn, cuantas, maxGrupos) => particiones(props.length, maxGrupos)
    .map((p) => { const m = fn(props, p, caja, g); return { p, m, s: puntaje(m, caja) }; })
    .sort((a, b) => b.s - a.s).slice(0, cuantas);

  // La principal grande a un lado (o arriba) y el resto justificado en lo que queda.
  function conPrincipal(props, caja, g, lado) {
    const [r0, ...resto] = props, vertical = lado === 'arriba';
    let hero;
    if (!vertical) { const w = Math.min(caja.w * 0.62, caja.h * r0), h = w / r0; hero = { x: lado === 'izquierda' ? caja.x : caja.x + caja.w - w, y: caja.y + (caja.h - h) / 2, w, h }; }
    else { const h = Math.min(caja.h * 0.6, caja.w / r0), w = h * r0; hero = { x: caja.x + (caja.w - w) / 2, y: caja.y, w, h }; }
    if (!resto.length) return [hero];
    const caja2 = !vertical ? { x: lado === 'izquierda' ? caja.x + hero.w + g : caja.x, y: caja.y, w: caja.w - hero.w - g, h: caja.h }
      : { x: caja.x, y: caja.y + hero.h + g, w: caja.w, h: caja.h - hero.h - g };
    return [hero, ...mejores(resto, caja2, g, !vertical ? columnas : filas, 1, 3)[0].m];
  }
  // Polaroid: la base justificada un poco más chica, con giros alternos, borde blanco y sombra; la principal más grande y encima.
  function polaroid(props, caja, g) {
    const b = mejores(props, caja, Math.max(g, caja.w * 0.03), filas, 1, 3)[0].m;
    return b.map((f, i) => {
      const k = i === 0 ? 0.98 : 0.86, w = f.w * k, h = f.h * k;
      return { x: f.x + (f.w - w) / 2, y: f.y + (f.h - h) / 2, w, h, rot: GIROS[i % GIROS.length], z: i === 0 ? props.length : i - 1, ...POLAROID };
    });
  }
  // Pila de álbum: copias impresas en cascada, la principal arriba del todo.
  function pila(props, caja) {
    const n = props.length, base = Math.min(caja.w, caja.h) * (n <= 3 ? 0.62 : 0.5);
    const orden = [...props.keys()].slice(1).concat(0);   // la principal al final = encima
    return props.map((r, i) => {
      const k = orden.indexOf(i), t = n > 1 ? k / (n - 1) : 0, w = r >= 1 ? base : base * r, h = r >= 1 ? base / r : base;
      return { x: caja.x + (caja.w - w) * t, y: caja.y + (caja.h - h) * (0.15 + 0.7 * ((k * 0.37) % 1)), w, h, rot: GIROS[(i + 2) % GIROS.length], z: k, ...POLAROID };
    });
  }
  // Diagonal editorial: tamaños decrecientes a lo largo de la diagonal, sin giro.
  function diagonal(props, caja) {
    const n = props.length;
    return props.map((r, i) => {
      const lado = Math.min(caja.w, caja.h) * (i === 0 ? 0.56 : Math.max(0.24, 0.44 - i * 0.03));
      const w = r >= 1 ? lado : lado * r, h = r >= 1 ? lado / r : lado, t = n > 1 ? i / (n - 1) : 0;
      return { x: caja.x + (caja.w - w) * t, y: caja.y + (caja.h - h) * t, w, h, z: n - i, sombra: 0.55, radio: 0.8 };
    });
  }
  // Clásicos: casillas que se llenan con recorte automático (rejilla, 1 grande + resto, antes y después).
  function clasicos(n, caja, g) {
    const out = [];
    const rejilla = (cols) => {
      const nf = Math.ceil(n / cols), h = (caja.h - g * (nf - 1)) / nf, m = []; let i = 0;
      for (let f = 0; f < nf; f++) { const c = Math.min(cols, n - i), w = (caja.w - g * (c - 1)) / c; for (let j = 0; j < c; j++, i++) m.push({ x: caja.x + j * (w + g), y: caja.y + f * (h + g), w, h }); }
      return m;
    };
    for (const cols of [...new Set([Math.max(1, Math.round(Math.sqrt(n))), Math.ceil(n / 2)])]) out.push(['rejilla-' + cols, 'Rejilla · ' + cols + (cols === 1 ? ' columna' : ' columnas'), rejilla(cols)]);
    if (n >= 3) {
      const k = n - 1, w = caja.w * 0.6, cols = k > 3 ? 2 : 1, rows = Math.ceil(k / cols), hh = (caja.h - g * (rows - 1)) / rows, ww = (caja.w - w - g - g * (cols - 1)) / cols;
      const m = [{ x: caja.x, y: caja.y, w, h: caja.h }];
      for (let i = 0; i < k; i++) m.push({ x: caja.x + w + g + (i % cols) * (ww + g), y: caja.y + Math.floor(i / cols) * (hh + g), w: ww, h: hh });
      out.push(['principal-izquierda', 'Grande a la izquierda', m]);
      const h2 = caja.h * 0.58, c2 = Math.min(k, 4), f2 = Math.ceil(k / c2), hh2 = (caja.h - h2 - g - g * (f2 - 1)) / f2, m2 = [{ x: caja.x, y: caja.y, w: caja.w, h: h2 }];
      for (let i = 0; i < k; i++) { const enFila = Math.min(c2, k - Math.floor(i / c2) * c2), ww2 = (caja.w - g * (enFila - 1)) / enFila; m2.push({ x: caja.x + (i % c2) * (ww2 + g), y: caja.y + h2 + g + Math.floor(i / c2) * (hh2 + g), w: ww2, h: hh2 }); }
      out.push(['principal-arriba', 'Grande arriba', m2]);
    }
    if (n === 2) out.push(['antes-despues', 'Antes y después', [{ x: caja.x, y: caja.y, w: (caja.w - g) / 2, h: caja.h }, { x: caja.x + (caja.w + g) / 2, y: caja.y, w: (caja.w - g) / 2, h: caja.h }]]);
    return out;
  }

  // El catálogo para n fotos en un lienzo de proporción `aspecto` (ancho/alto). `proporciones`: ancho/alto de cada original,
  // en el orden del collage (la principal primero). Sin ellas se asume retrato 4:5.
  function catalogo(n, aspecto = 0.8, opciones = {}) {
    if (!Number.isInteger(n) || n < 2 || n > 9 || !Number.isFinite(aspecto) || aspecto <= 0) return [];
    const op = opcionesDe(opciones), caja = area(aspecto, op), W = caja.W, H = caja.H, g = caja.g;
    // En el lienzo virtual 1 unidad de ancho = 1 de alto: una foto de proporción p ocupa p de ancho por 1 de alto.
    const props = Array.from({ length: n }, (_, i) => { const p = Number(opciones.proporciones?.[i]); return Number.isFinite(p) && p > 0.2 && p < 5 ? p : 0.8; });
    const out = [], vistos = new Set();
    const agrega = (id, nombre, familia, marcos, completa = true) => {
      const ms = marcos.map((f, i) => ({ marco: aPorc(W, H, f), z: f.z ?? i, rotacion: f.rot || 0, radio: f.radio || 0, borde: f.borde ? { ...f.borde } : null, sombra: f.sombra || 0 }));
      const firma = JSON.stringify(ms.map((m) => m.marco)); if (vistos.has(firma)) return; vistos.add(firma);
      out.push({ id: 'sa-' + id, nombre, familia, ...(completa ? { ajuste: 'completa' } : {}), zona: op.zona, marcos: ms });
    };
    mejores(props, caja, g, filas, 4, 4).forEach((b, i) => agrega('filas-' + (i + 1), i ? 'Filas · opción ' + (i + 1) : 'Smart · filas', 'Smart', b.m));
    mejores(props, caja, g, columnas, 3, 4).forEach((b, i) => agrega('columnas-' + (i + 1), i ? 'Columnas · opción ' + (i + 1) : 'Smart · columnas', 'Smart', b.m));
    for (const lado of ['izquierda', 'derecha', 'arriba']) agrega('principal-' + lado, 'Principal ' + (lado === 'arriba' ? 'arriba' : 'a la ' + lado), 'Destacadas', conPrincipal(props, caja, g, lado));
    agrega('tira-horizontal', 'Tira horizontal', 'Tiras', filas(props, [n], caja, g));
    agrega('tira-vertical', 'Tira vertical', 'Tiras', columnas(props, [n], caja, g));
    agrega('polaroid', 'Polaroid', 'Álbum', polaroid(props, caja, g));
    agrega('pila', 'Pila de fotos', 'Álbum', pila(props, caja));
    agrega('diagonal', 'Diagonal editorial', 'Álbum', diagonal(props, caja));
    for (const [id, nombre, m] of clasicos(n, caja, g)) agrega('clasico-' + id, nombre, 'Clásicos', m, false);
    return out;
  }

  // Dentro del lienzo y con números que acepta el servidor (contenido-collage.normaliza).
  function valida(d) {
    return Array.isArray(d?.marcos) && d.marcos.every((m) => { const k = m.marco; return [k.x, k.y, k.w, k.h].every(Number.isFinite) && k.w >= 2 && k.h >= 2 && k.x >= -0.01 && k.y >= -0.01 && k.x + k.w <= 100.01 && k.y + k.h <= 100.01 && Math.abs(m.rotacion) <= 45; });
  }

  return { catalogo, opcionesDe, valida, ZONAS };
});
