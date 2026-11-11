// Editor de flyers V4 — paridad con la primera propuesta (ZIP «DCARELA_EDITOR_COMPLETO_PALETA_CRM_V4») SOBRE el Estudio real.
// No es un segundo editor: añade las superficies que faltaban y cada botón llama a lo que el Estudio ya hace.
//  · Izquierda: Plantillas · Mis diseños · Fotos · Recursos · Marca.
//  · Derecha: Propiedades · Capas · Estilos · Efectos · Diseño (Estilos y Efectos son secciones reales del panel Diseño).
//  · Banda inferior: variantes 4:5 / 9:16 / 1:1 (el mismo selector de formato) y las 6 acciones del Motor V7.
//  · Cabecera: «Guardar JSON» (el diseño como archivo) y el estado del motor.
// Los cambios de campos pasan por `DcarelaEditor2Extras.restaura` (un solo paso del historial: Ctrl+Z lo deshace).
// Interruptor: localStorage.flyerEditorV4 = '0' (o el general flyerEditor2Enabled = '0').
(function () {
  'use strict';
  const V = window.DcarelaEditorV4Core;
  try { if (!V || localStorage.getItem('flyerEditor2Enabled') === '0' || localStorage.getItem('flyerEditorV4') === '0') return; } catch (_) { if (!V) return; }
  const E = () => window.DcarelaEditor2Extras || null;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const formulario = () => $$('form').find((f) => f.__api238 && f.isConnected) || null;
  const api = () => { const f = formulario(); return f ? f.__api238 : null; };
  const raiz = () => { const f = formulario(); return f ? $('.e238', f) : null; };
  const svg = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  const ICO = {
    generar: svg('<path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/>'),
    conservar: svg('<path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/>'),
    recomponer: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
    adaptar: svg('<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>'),
    tipografia: svg('<path d="M4 7V5h16v2"/><path d="M9 19h6"/><path d="M12 5v14"/>'),
    referencia: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>'),
    variantes: svg('<path d="M12 2l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/>'),
    json: svg('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>'),
  };
  const marcaNegocio = () => {
    const id = window.DcarelaIdentidad, cfg = window.CRM_CONFIG || window.DCARELA_CRM_CONFIG || {};
    return (id && id.MARCA) || { nombre: (cfg.marca && cfg.marca.nombre) || cfg.brandName || '', instagram: (cfg.marca && cfg.marca.instagram) || '', ciudad: (cfg.marca && cfg.marca.ciudad) || '' };
  };
  function aviso(texto) { const b = $('[data-e238-estado]'); if (b) { b.dataset.tipo = 'aviso'; b.innerHTML = '<span>' + esc(texto) + '</span>'; b.hidden = false; } }
  // Aplica campos al formulario real como UN paso del historial (misma vía que «Restaurar un diseño»).
  function aplica(campos, hecho) {
    const a = api(), x = E(); if (!a || !x) { aviso('El editor no está listo todavía.'); return 0; }
    if (!Object.keys(campos).length) return 0;
    const n = x.restaura({ plantilla: a.idReal, valores: campos });
    if (n && hecho) aviso(hecho + ' Ctrl+Z lo deshace.');
    return n;
  }
  const valoresActuales = () => { try { return api().valores() || {}; } catch (_) { return {}; } };
  const opcionesDe = (el) => (el && el.tagName === 'SELECT') ? [...el.options].map((o) => [o.value, o.textContent]) : [];
  const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));

  // ---------- el Motor V7 PROPONE y el operador acepta (ZIP V4: «propuestas con diff, nunca sobrescribir sin comando») ----------
  const CLAVE_PROPONER = 'dcarela.editorV4.proponer';
  const proponerActivo = () => { try { return localStorage.getItem(CLAVE_PROPONER) !== '0'; } catch (_) { return true; } };
  function fijaProponer(si) { try { localStorage.setItem(CLAVE_PROPONER, si ? '1' : '0'); } catch (_) { /* vale esta sesión */ } guardaEnServidor(); }
  function propone(titulo, campos, hecho, alAplicar) {
    if (!Object.keys(campos).length) return 0;
    if (!proponerActivo()) { const n = aplica(campos, hecho); if (n && alAplicar) alAplicar(); return n; }
    const f = formulario(), etiquetas = {};
    for (const k of Object.keys(campos)) { const el = f && f.elements[k]; if (el && el.tagName === 'SELECT') etiquetas[k] = Object.fromEntries(opcionesDe(el)); }
    const dif = V.diferencias(campos, valoresActuales(), etiquetas);
    if (!dif.length) { aviso('No hay nada que cambiar: el diseño ya está así.'); return 0; }
    $$('.e2-fondo').forEach((n) => n.remove());
    const fondo = document.createElement('div'); fondo.className = 'e2-fondo';
    fondo.innerHTML = '<div class="e2-caja e2v4-prop" role="dialog" aria-modal="true" aria-label="' + esc('Propuesta: ' + titulo) + '"><header><b>' + esc('Motor V7 propone: ' + titulo) + '</b><button class="e2-btn" type="button" data-e2v4-no>Descartar</button></header>'
      + '<table class="e2v4-dif"><thead><tr><th>Qué cambia</th><th>Ahora</th><th>Propuesto</th></tr></thead><tbody>'
      + dif.map((d) => '<tr><td>' + esc(d.nombre) + '</td><td>' + esc(d.antes) + '</td><td><b>' + esc(d.despues) + '</b></td></tr>').join('') + '</tbody></table>'
      + '<div class="e2-pie"><label class="e2v4-check"><input type="checkbox" data-e2v4-siempre> Aplicar sin preguntar la próxima vez</label><button class="e2-btn e2v4-si" type="button" data-e2v4-si>Aplicar</button></div></div>';
    const cierra = (descartada) => { fondo.remove(); if (descartada) aviso('Propuesta descartada: el diseño no cambió.'); };
    fondo.addEventListener('mousedown', (e) => { if (e.target === fondo) cierra(true); });
    fondo.addEventListener('keydown', (e) => { if (e.key === 'Escape') cierra(true); });
    fondo.addEventListener('click', (e) => {
      if (e.target.closest('[data-e2v4-no]')) { cierra(true); return; }
      if (!e.target.closest('[data-e2v4-si]')) return;
      if ($('[data-e2v4-siempre]', fondo).checked) fijaProponer(false);
      cierra(false); const n = aplica(campos, hecho); if (n && alAplicar) alAplicar();
    });
    document.body.appendChild(fondo); const b = $('[data-e2v4-si]', fondo); if (b) b.focus();
    return dif.length;
  }

  // ---------- preferencias del editor por usuario (servidor) ----------
  // La paleta (editor2-tools) guarda perfil, favoritos, ocultas, orden y atajos en este navegador; aquí se copian a
  // crm_preferencias_usuario/{uid} (solo el propio usuario lee y escribe) y se recuperan en otro equipo.
  let guardando = 0;
  function prefsLocales() {
    const reg = window.DcarelaEditor2 && window.DcarelaEditor2.registro && window.DcarelaEditor2.registro();
    return V.limpiaPrefs({ ...(reg ? reg.getPreferences() : {}), proponer: proponerActivo() });
  }
  function guardaEnServidor() {
    const S = window.DcarelaPrefsServidor; if (!S) return;
    clearTimeout(guardando);
    guardando = setTimeout(() => { S.guarda(prefsLocales()).catch(() => { /* sin red: queda la copia local */ }); }, 1200);
  }
  let prefsTraidas = false;
  async function traePrefs() {
    const S = window.DcarelaPrefsServidor, reg = window.DcarelaEditor2 && window.DcarelaEditor2.registro && window.DcarelaEditor2.registro();
    if (prefsTraidas || !S || !reg) return;
    prefsTraidas = true;
    let p = null; try { p = await S.lee(); } catch (_) { return; }
    if (!p) { guardaEnServidor(); return; } // primera vez: sube las de este equipo
    const limpias = V.limpiaPrefs(p);
    if (typeof limpias.proponer === 'boolean') { try { localStorage.setItem(CLAVE_PROPONER, limpias.proponer ? '1' : '0'); } catch (_) { /* nada */ } }
    delete limpias.proponer;
    if (Object.keys(limpias).length && window.DcarelaEditor2.aplicaPrefs) window.DcarelaEditor2.aplicaPrefs(limpias);
  }

  // ---------- Motor V7 (6 acciones) ----------
  const MOTOR = {
    generar: { puede: () => !!api(), hace: () => { api().previsualiza(); aviso('Componiendo con el motor V7…'); } },
    conservar: { puede: () => !!(api() && E()), hace: () => { const r = E().conserva(); aviso(r.repetido ? 'Ese diseño ya estaba conservado.' : r.ok ? 'Diseño conservado. Lo encuentras en «Mis diseños».' : 'No se pudo guardar en este equipo.'); pintaMisDisenos(); } },
    recomponer: { puede: () => !!api(), hace: () => { const p = V.planRecomponer(valoresActuales()); if (!Object.keys(p).length) { aviso('Las capas ya están donde las coloca el motor.'); return; } const n = Object.keys(p).length; propone('Recomponer', p, 'Capas devueltas a su sitio (' + n + (n === 1 ? ' ajuste).' : ' ajustes).')); } },
    adaptar: { puede: () => { const b = $('[data-e238="formatos3"]', raiz() || document); return !!b && !b.disabled; }, hace: () => $('[data-e238="formatos3"]', raiz()).click() },
    tipografia: { puede: () => { const f = formulario(); return !!f && V.siguienteOpcion(opcionesDe(f.elements.tipografia).map((o) => o[0]), f.elements.tipografia && f.elements.tipografia.value) !== null; },
      hace: () => { const el = formulario().elements.tipografia, ops = opcionesDe(el), sig = V.siguienteOpcion(ops.map((o) => o[0]), el.value); const nombre = (ops.find((o) => o[0] === sig) || [])[1] || sig; propone('Variar tipografía', { tipografia: sig }, 'Letra del titular: ' + nombre + '.'); } },
    referencia: { puede: () => !!$('[data-e238-tool="recrear"]', raiz() || document), hace: () => $('[data-e238-tool="recrear"]', raiz()).click() },
  };

  // ---------- izquierda ----------
  function pintaMisDisenos() {
    const c = $('[data-e2v4-mis]'); if (!c) return;
    const x = E(), puntos = x ? V.ordenaPuntos(x.puntos()) : [], a = api();
    c.innerHTML = '<div class="e2v4-acciones">'
      + '<button type="button" class="e238-btn e238-peq" data-e2v4-mis-acc="conservar">Conservar el actual</button>'
      + '<button type="button" class="e238-btn e238-peq" data-e2v4-mis-acc="archivo">Guardar JSON</button>'
      + '<button type="button" class="e238-btn e238-peq" data-e2v4-mis-acc="abrir">Abrir JSON…</button>'
      + '<button type="button" class="e238-btn e238-peq" data-e2v4-mis-acc="borrador">Guardar borrador</button></div>'
      + (puntos.length ? '<ul class="e2v4-lista">' + puntos.slice(0, 40).map((p, i) => '<li><b>' + esc(p.nombre) + '</b><small>' + esc(p.plantilla) + (a && p.plantilla === a.idReal ? ' · esta plantilla' : '') + ' · '
        + esc(new Date(p.cuando).toLocaleString('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })) + '</small><button type="button" class="e238-btn e238-peq" data-e2v4-abrir="' + i + '">Abrir</button></li>').join('') + '</ul>'
        : '<p class="e2v4-vacio">Aún no hay diseños conservados. Usa «Conservar el actual» o «Conservar diseño» del Motor V7 antes de probar cambios grandes.</p>');
    c.onclick = async (e) => {
      const acc = e.target.closest('[data-e2v4-mis-acc]'), ab = e.target.closest('[data-e2v4-abrir]'), x2 = E();
      if (acc && x2) {
        const k = acc.dataset.e2v4MisAcc;
        if (k === 'conservar') MOTOR.conservar.hace();
        else if (k === 'archivo') x2.guardaArchivo();
        else if (k === 'abrir' && x2.abreArchivo) x2.abreArchivo();
        else if (k === 'borrador') { const b = $('[data-ceditor-borrador]', raiz()); if (b) b.click(); }
      } else if (ab && x2) {
        const p = puntos[Number(ab.dataset.e2v4Abrir)]; if (!p) return;
        try { await x2.aplicaArchivo({ plantilla: p.plantilla, valores: p.valores }); } catch (err) { aviso(err.message || 'No se pudo abrir ese diseño.'); }
      }
    };
  }
  function pintaMarca() {
    const c = $('[data-e2v4-marca]'); if (!c) return;
    const m = marcaNegocio(), id = window.DcarelaIdentidad || {}, t = id.TEL_TXT || {}, v = valoresActuales();
    const sw = (k, si, no, etq) => (k in v) ? '<button type="button" class="e238-btn e238-peq' + (v[k] === si ? ' e2v4-on' : '') + '" data-e2v4-sw="' + k + '" data-si="' + si + '" data-no="' + no + '" aria-pressed="' + (v[k] === si) + '">' + esc(etq) + '</button>' : '';
    c.innerHTML = '<dl class="e2v4-kit"><dt>Nombre</dt><dd>' + esc(m.nombre) + '</dd><dt>Redes</dt><dd>' + esc(m.instagram) + '</dd><dt>Ciudad</dt><dd>' + esc(m.ciudad) + '</dd>'
      + (t.oficial ? '<dt>WhatsApp</dt><dd>' + esc(t.web || '') + (t.web ? ' · ' : '') + esc(t.oficial) + '</dd>' : '') + '</dl>'
      + '<button type="button" class="e238-btn e238-prim e238-peq e2v4-ancho" data-e2v4-marca-aplica>Poner firma, redes y ciudad</button>'
      + '<div class="e2v4-acciones">' + sw('mostrar_marca', 'visible', 'oculto', 'Firma') + sw('mostrar_contactos', 'visible', 'oculto', 'Redes y ciudad') + sw('mostrar_whatsapp', 'si', 'no', 'WhatsApp en el botón') + '</div>'
      + '<p class="e2v4-nota">Los datos salen de la configuración del negocio (crm-config.js). Para escribir otro texto, abre Diseño → «Marca y contacto».</p>';
    c.onclick = (e) => {
      if (e.target.closest('[data-e2v4-marca-aplica]')) { const p = V.planMarca(m, valoresActuales()); if (!Object.keys(p).length) aviso('La firma, las redes y la ciudad ya están puestas.'); else propone('Firma del negocio', p, 'Firma del negocio aplicada.', pintaMarca); return; }
      const b = e.target.closest('[data-e2v4-sw]'); if (!b) return;
      const k = b.dataset.e2v4Sw, ahora = valoresActuales()[k];
      aplica({ [k]: ahora === b.dataset.si ? b.dataset.no : b.dataset.si }, b.textContent + (ahora === b.dataset.si ? ': oculto.' : ': visible.'));
      pintaMarca();
    };
  }
  function montaIzquierda(r) {
    const izq = $('.e238-izq', r); if (!izq || $('.e2v4-izq-tabs', izq)) return;
    const tpl = $('[data-e238-tpls]', izq), fot = $('[data-e238-fotos]', izq);
    const secPlant = tpl && tpl.closest('section'), secFotos = fot && fot.closest('section');
    if (!secPlant || !secFotos) return;
    const card = (k, titulo, cuerpo) => { const s = document.createElement('section'); s.className = 'e238-card e2v4-card'; s.dataset.e2v4Panel = k; s.innerHTML = '<header class="e238-card-cab"><h2>' + esc(titulo) + '</h2></header><div class="e2v4-cuerpo" ' + cuerpo + '></div>'; s.hidden = true; return s; };
    const mis = card('misdisenos', 'Mis diseños', 'data-e2v4-mis'), rec = card('recursos', 'Recursos', 'data-e2v4-rec'), mar = card('marca', 'Marca', 'data-e2v4-marca');
    secPlant.dataset.e2v4Panel = 'plantillas'; secFotos.dataset.e2v4Panel = 'fotos';
    secFotos.after(mis, rec, mar);
    $('[data-e2v4-rec]', rec).innerHTML = '<div class="e2v4-recursos">' + V.RECURSOS.filter(([k]) => $('[data-e238-tool="' + k + '"]', r)).map(([k, t, n]) => '<button type="button" class="e2v4-rec" data-e238-tool="' + k + '" title="' + esc(n) + '"><b>' + esc(t) + '</b><small>' + esc(n) + '</small></button>').join('') + '</div>';
    const nav = document.createElement('nav'); nav.className = 'e2v4-izq-tabs'; nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Recursos del editor');
    nav.innerHTML = V.PARIDAD.izquierda.map(([k, t], i) => '<button type="button" role="tab" data-e2v4-izq="' + k + '" aria-selected="' + (i === 0) + '"' + (i === 0 ? ' class="on"' : '') + '>' + esc(t) + '</button>').join('');
    izq.prepend(nav);
    const muestra = (k) => {
      $$('[data-e2v4-izq]', nav).forEach((b) => { const on = b.dataset.e2v4Izq === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
      $$('[data-e2v4-panel]', izq).forEach((s) => { s.hidden = s.dataset.e2v4Panel !== k; });
      if (k === 'misdisenos') pintaMisDisenos(); if (k === 'marca') pintaMarca();
    };
    nav.addEventListener('click', (e) => { const b = e.target.closest('[data-e2v4-izq]'); if (b) muestra(b.dataset.e2v4Izq); });
    muestra('plantillas');
    // «Agregar foto» del Estudio abre la biblioteca: que se vea la pestaña Fotos.
    r.addEventListener('click', (e) => { if (e.target.closest('[data-e238-tool="foto"],[data-e238="subir"]')) muestra('fotos'); });
  }

  // ---------- derecha ----------
  let modo = null; // null (Propiedades/Capas) | 'estilos' | 'efectos' | 'diseno'
  function filtraDiseno(r) {
    const dis = $('[data-e238-diseno]', r); if (!dis) return;
    for (const d of $$(':scope > details', dis)) {
      const t = (d.querySelector('summary') || {}).textContent || '';
      const ver = !modo || V.seccionVisible(modo, t);
      d.hidden = !ver; if (ver && (modo === 'estilos' || modo === 'efectos')) d.open = true;
    }
    const tipos = $('[data-e2v4-tipos]', r); if (tipos) { tipos.hidden = modo !== 'estilos'; if (!tipos.hidden) pintaTipos(r); }
    $$('[data-e2v4-tab]', r).forEach((b) => { const on = b.dataset.e2v4Tab === modo; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    if (modo === 'estilos' || modo === 'efectos') { const real = $('[data-e238-tab="diseno"]', r); if (real) { real.classList.remove('on'); real.setAttribute('aria-selected', 'false'); } }
  }
  function pintaTipos(r) {
    const c = $('[data-e2v4-tipos]', r), f = formulario(); if (!c || !f) return;
    const filas = V.CAMPOS_TIPO.filter(([k]) => f.elements[k] && f.elements[k].tagName === 'SELECT');
    c.innerHTML = filas.length ? '<h3>Tipografía</h3>' + filas.map(([k, t]) => '<label class="e238-campo"><span>' + esc(t) + '</span><select data-e2v4-tipo="' + k + '">' + opcionesDe(f.elements[k]).map(([v, n]) => '<option value="' + esc(v) + '"' + (v === f.elements[k].value ? ' selected' : '') + '>' + esc(n) + '</option>').join('') + '</select></label>').join('')
      : '<p class="e2v4-nota">Esta plantilla no tiene tipografías intercambiables.</p>';
    // Cuentagotas: toma un color de cualquier punto de la pantalla (la foto del lienzo incluida) con el EyeDropper del navegador.
    const colores = V.CAMPOS_COLOR.filter(([k]) => f.elements[k]), hayGotero = typeof window.EyeDropper === 'function';
    if (colores.length) c.innerHTML += '<h3>Cuentagotas</h3>' + (hayGotero ? '' : '<p class="e2v4-nota">Este navegador no tiene cuentagotas: usa Chrome o Edge (o la app de escritorio).</p>')
      + colores.map(([k, t]) => { const v = V.normalizaColor(f.elements[k].value) || ''; return '<div class="e2v4-gota"><i style="background:' + esc(v || 'transparent') + '"></i><span>' + esc(t) + '<small>' + esc(v || 'de la plantilla') + '</small></span><button type="button" class="e238-btn e238-peq" data-e2v4-gota="' + k + '"' + (hayGotero ? '' : ' disabled') + ' title="Haz clic y luego toca un color de la foto">Tomar color</button></div>'; }).join('');
    c.onchange = (e) => { const s = e.target.closest('[data-e2v4-tipo]'); if (s) aplica({ [s.dataset.e2v4Tipo]: s.value }, 'Tipografía cambiada.'); };
    c.onclick = async (e) => {
      const b = e.target.closest('[data-e2v4-gota]'); if (!b || b.disabled || !hayGotero) return;
      let r1 = null; try { r1 = await new window.EyeDropper().open(); } catch (_) { return; } // Esc cancela
      const color = V.normalizaColor(r1 && r1.sRGBHex);
      if (!color) { aviso('No se pudo leer ese color.'); return; }
      aplica({ [b.dataset.e2v4Gota]: color }, 'Color tomado: ' + color + '.'); pintaTipos(raiz());
    };
  }
  function montaDerecha(r) {
    const nav = $('.e238-tabs', r); if (!nav || $('[data-e2v4-tab]', nav)) return;
    const ed = $('[data-e238-tab="editar"]', nav), di = $('[data-e238-tab="diseno"]', nav);
    if (!ed || !di) return;
    ed.textContent = 'Propiedades';
    for (const [k, t] of V.PARIDAD.derecha.filter(([k]) => k === 'estilos' || k === 'efectos')) {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', 'false'); b.dataset.e2v4Tab = k; b.textContent = t; di.before(b);
    }
    nav.classList.add('e2v4-5');
    const tipos = document.createElement('div'); tipos.className = 'e2v4-tipos'; tipos.dataset.e2v4Tipos = '1'; tipos.hidden = true;
    const dis = $('[data-e238-diseno]', r); if (dis) dis.before(tipos);
    let interno = false; // el clic que hacemos nosotros en «Diseño» no debe borrar el modo Estilos/Efectos
    nav.addEventListener('click', (e) => {
      const mio = e.target.closest('[data-e2v4-tab]');
      if (mio) { modo = mio.dataset.e2v4Tab; interno = true; try { di.click(); } finally { interno = false; } setTimeout(() => filtraDiseno(r), 0); return; }
      const real = e.target.closest('[data-e238-tab]');
      if (real && !interno) { modo = real.dataset.e238Tab === 'diseno' ? 'diseno' : null; setTimeout(() => filtraDiseno(r), 0); }
    });
    if (dis) new MutationObserver(() => filtraDiseno(r)).observe(dis, { childList: true });
  }

  // ---------- banda inferior: variantes + Motor V7 ----------
  function pintaVariantes(r) {
    const f = formulario(), sel = f && f.elements.formato, actual = sel ? sel.value : '';
    $$('[data-e2v4-fmt]', r).forEach((b) => { const ok = !!sel && [...sel.options].some((o) => o.value === b.dataset.e2v4Fmt); b.disabled = !ok; const on = b.dataset.e2v4Fmt === actual; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  }
  function pintaMotor(r) { $$('[data-e2v4-v7]', r).forEach((b) => { let ok = false; try { ok = MOTOR[b.dataset.e2v4V7].puede(); } catch (_) { ok = false; } b.disabled = !ok; }); }
  // ---------- Repartir textos con el mismo espacio ----------
  let medidaReparto = null;
  function reparte() {
    const a = api(), XC = window.DcarelaEditor2ExtrasCore; if (!a || !XC) { aviso('El editor no está listo todavía.'); return; }
    let cajas = []; try { cajas = (a.ultimoMotor() || [])[0] || []; } catch (_) { /* aún sin vista */ }
    if (cajas === medidaReparto) { aviso('El editor sigue dibujando el cambio anterior; espera un momento y vuelve a repartir.'); return; }
    const r = V.calculaReparto(cajas, valoresActuales(), XC.CAMPOS_ALINEA);
    if (r.error) { aviso(r.error); return; }
    if (!Object.keys(r.cambios).length) { aviso('Los textos ya están repartidos con el mismo espacio.'); return; }
    propone('Repartir textos', r.cambios, 'Textos repartidos con ' + r.hueco + ' % entre bloques' + (r.limitado ? ' (alguno llegó al tope de movimiento)' : '') + '.', () => { medidaReparto = cajas; });
  }

  // ---------- Exportar las 3 variantes en lote (el mismo JPG que da «Solo descargar JPG», una por formato) ----------
  let enLote = false;
  async function exportaLote(r) {
    if (enLote) return;
    const f = formulario(), sel = f && f.elements.formato, btn = $('[data-ceditor-exportar]', raiz());
    if (!sel || !btn) { aviso('Desde aquí no se puede exportar.'); return; }
    const inicial = sel.value, orden = V.ordenLote(inicial, [...sel.options].map((o) => o.value));
    const nombre = (k) => (V.PARIDAD.variantes.find((v) => v[0] === k) || [k, k])[1];
    const pone = (k) => { if (sel.value === k) return; sel.value = k; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); };
    enLote = true; const loteBtn = $('[data-e2v4-lote]', r); if (loteBtn) loteBtn.disabled = true;
    const vista = () => { try { return (api().ultimoMotor() || [])[0] || null; } catch (_) { return null; } };
    const hechos = [], fallidos = [];
    try {
      for (const [i, k] of orden.entries()) {
        aviso('Lote: preparando ' + nombre(k) + ' (' + (i + 1) + ' de ' + orden.length + ')…');
        if (sel.value !== k) {
          // Cada formato guarda su propia composición: hay que esperar a que el motor la dibuje antes de exportar,
          // o el botón ignora el clic (aún no hay foto para ese formato).
          const antes = vista(); pone(k); pintaVariantes(r);
          for (let n = 0; n < 150 && vista() === antes; n++) await dormir(400);
          if (vista() === antes) { fallidos.push(nombre(k) + ' (el motor no terminó)'); continue; }
          await dormir(600);
        }
        btn.click();
        let arranco = false; for (let n = 0; n < 8 && !arranco; n++) { await dormir(200); arranco = btn.disabled; }
        if (!arranco) { fallidos.push(nombre(k) + ' (falta la foto o el titular)'); continue; }
        for (let n = 0; n < 180 && btn.disabled; n++) await dormir(500); // el servidor compone el JPG
        if (btn.disabled) { fallidos.push(nombre(k) + ' (el servidor tardó demasiado)'); continue; }
        hechos.push(nombre(k));
      }
      aviso(fallidos.length ? 'Lote: ' + hechos.length + ' de ' + orden.length + ' descargados' + (hechos.length ? ' (' + hechos.join(', ') + ')' : '') + '. No salieron: ' + fallidos.join('; ') + '.'
        : 'Lote listo: ' + hechos.length + ' JPG descargados (' + hechos.join(', ') + ').');
    } catch (err) { aviso((err && err.message) || 'No se pudo terminar el lote.'); }
    finally { pone(inicial); pintaVariantes(r); enLote = false; if (loteBtn) loteBtn.disabled = false; }
    return hechos.length;
  }

  function montaDock(r) {
    const cuerpo = $('.e238-cuerpo', r); if (!cuerpo || $('.e2v4-dock', r)) return;
    const d = document.createElement('section'); d.className = 'e2v4-dock e238-card'; d.setAttribute('aria-label', 'Variantes y Motor V7');
    d.innerHTML = '<div class="e2v4-grupo"><span class="e2v4-tit">' + ICO.variantes + '<b>Variantes</b></span>'
      + V.PARIDAD.variantes.map(([k, t, dim]) => '<button type="button" class="e2v4-var" data-e2v4-fmt="' + k + '" title="' + esc(t + ' · ' + dim) + '"><i data-r="' + k + '"></i>' + esc(t) + '</button>').join('')
      + '<button type="button" class="e2v4-v7" data-e2v4-lote title="Descarga el JPG en 4:5, 9:16 y 1:1 con el mismo diseño">' + ICO.json + '<span>Exportar las 3</span></button></div>'
      + '<div class="e2v4-grupo"><span class="e2v4-tit">' + ICO.recomponer + '<b>Ordenar</b></span>'
      + '<button type="button" class="e2v4-v7" data-e2v4-ord="alinear" title="Alinea la capa activa a un borde o al centro del lienzo">' + ICO.adaptar + '<span>Alinear</span></button>'
      + '<button type="button" class="e2v4-v7" data-e2v4-ord="repartir" title="Reparte los textos en vertical con el mismo espacio entre ellos">' + ICO.tipografia + '<span>Repartir textos</span></button></div>'
      + '<div class="e2v4-grupo e2v4-motor"><span class="e2v4-tit">' + ICO.generar + '<b>Motor V7</b></span>'
      + V.PARIDAD.motor.map(([k, t, nota]) => '<button type="button" class="e2v4-v7" data-e2v4-v7="' + k + '" title="' + esc(nota) + '">' + ICO[k] + '<span>' + esc(t) + '</span></button>').join('')
      + '<label class="e2v4-check" title="Antes de cambiar el diseño, el motor muestra qué cambiaría y espera su visto bueno"><input type="checkbox" data-e2v4-proponer' + (proponerActivo() ? ' checked' : '') + '> Proponer primero</label></div>';
    cuerpo.after(d);
    r.classList.add('e2v4');
    d.addEventListener('change', (e) => { if (e.target.matches('[data-e2v4-proponer]')) { fijaProponer(e.target.checked); aviso(e.target.checked ? 'El motor mostrará cada cambio antes de aplicarlo.' : 'El motor aplicará los cambios directamente (Ctrl+Z los deshace).'); } });
    d.addEventListener('click', (e) => {
      if (e.target.closest('[data-e2v4-lote]')) { exportaLote(r); return; }
      const ob = e.target.closest('[data-e2v4-ord]');
      if (ob) { if (ob.dataset.e2v4Ord === 'repartir') reparte(); else if (E() && E().abreAlinear) E().abreAlinear(); return; }
      const fb = e.target.closest('[data-e2v4-fmt]'), mb = e.target.closest('[data-e2v4-v7]');
      if (fb && !fb.disabled) { const sel = formulario().elements.formato; if (sel.value !== fb.dataset.e2v4Fmt) { sel.value = fb.dataset.e2v4Fmt; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); } pintaVariantes(r); }
      if (mb && !mb.disabled) { try { MOTOR[mb.dataset.e2v4V7].hace(); } catch (err) { aviso(err.message || 'No se pudo.'); } setTimeout(() => pintaMotor(r), 300); }
    });
    r.addEventListener('change', (e) => { if (e.target && e.target.name === 'formato') pintaVariantes(r); if (e.target && e.target.name === 'tipografia') pintaMotor(r); });
    pintaVariantes(r); pintaMotor(r);
  }
  function montaCabecera(r) {
    const acc = $('.e238-cab-acc', r); if (!acc || $('[data-e2v4-json]', acc)) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'e238-btn'; b.dataset.e2v4Json = '1'; b.title = 'Guardar el diseño editable como archivo JSON (plantilla y ajustes, sin fotos)';
    b.innerHTML = ICO.json + '<span>Guardar JSON</span>'; b.addEventListener('click', () => { const x = E(); if (x) x.guardaArchivo(); });
    acc.prepend(b);
    const p = $('.e238-cab-txt p', r); if (p && !$('.e2v4-chip', p)) p.insertAdjacentHTML('beforeend', ' <span class="e2v4-chip" title="El motor del servidor compone la vista exacta del flyer">Motor V7 · conectado</span>');
  }

  // Autoprueba: qué superficies del inventario V4 faltan en pantalla (vacío = todas presentes).
  function paridad() {
    const r = raiz(); if (!r) return ['editor-cerrado'];
    const p = [...$$('[data-e2v4-izq]', r).map((b) => 'izquierda:' + b.dataset.e2v4Izq),
      ...$$('.e238-tabs [data-e238-tab],.e238-tabs [data-e2v4-tab]', r).map((b) => 'derecha:' + (b.dataset.e238Tab || b.dataset.e2v4Tab)),
      ...$$('[data-e2v4-v7]', r).map((b) => 'motor:' + b.dataset.e2v4V7), ...$$('[data-e2v4-fmt]', r).map((b) => 'variantes:' + b.dataset.e2v4Fmt)];
    return V.faltantes(p);
  }

  function estilos() {
    if ($('#e2v4-estilos')) return;
    const s = document.createElement('style'); s.id = 'e2v4-estilos';
    s.textContent = '.e238.e2v4{--editor-alto:clamp(360px,calc(100dvh - 352px),1040px)}'
      + '.e2v4-izq-tabs{display:flex;flex-wrap:wrap;gap:2px;padding:3px;border-radius:10px;background:var(--e-lienzo);flex:none}'
      + '.e2v4-izq-tabs button{flex:1 1 auto;height:28px;padding:0 5px;border:0;border-radius:8px;background:none;font:inherit;font-size:11px;font-weight:650;color:var(--e-mut);cursor:pointer;white-space:nowrap}'
      + '.e2v4-izq-tabs button.on{background:var(--e-card);color:var(--e-acc);box-shadow:0 1px 3px rgba(15,23,42,.12)}'
      + '.e2v4-card[hidden],.e238-izq>[data-e2v4-panel][hidden]{display:none!important}.e2v4-cuerpo{padding:0 14px 14px;display:flex;flex-direction:column;gap:10px}'
      + '.e2v4-acciones{display:flex;flex-wrap:wrap;gap:6px}.e2v4-ancho{width:100%;justify-content:center}.e2v4-on{border-color:var(--e-acc)!important;color:var(--e-acc)!important}'
      + '.e2v4-lista{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}.e2v4-lista li{display:grid;grid-template-columns:1fr auto;gap:2px 8px;align-items:center;padding:8px 10px;border:1px solid var(--e-borde);border-radius:10px;background:var(--e-card)}'
      + '.e2v4-lista b{font-weight:650;font-size:12.5px}.e2v4-lista small{grid-column:1;color:var(--e-mut);font-size:11px}.e2v4-lista button{grid-column:2;grid-row:1/span 2}'
      + '.e2v4-vacio,.e2v4-nota{margin:0;color:var(--e-mut);font-size:12px;line-height:1.45}'
      + '.e2v4-recursos{display:grid;grid-template-columns:1fr 1fr;gap:6px}.e2v4-rec{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:9px 10px;text-align:left;border:1px solid var(--e-borde);border-radius:10px;background:var(--e-card);color:var(--e-txt);font:inherit;cursor:pointer}'
      + '.e2v4-rec:hover{border-color:var(--e-acc)}.e2v4-rec b{font-size:12.5px;font-weight:650}.e2v4-rec small{font-size:10.5px;color:var(--e-mut);line-height:1.3}'
      + '.e2v4-kit{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;margin:0;font-size:12.5px}.e2v4-kit dt{color:var(--e-mut)}.e2v4-kit dd{margin:0;font-weight:600;word-break:break-word}'
      + '.e238-tabs.e2v4-5{grid-template-columns:repeat(5,1fr)}.e238-tabs.e2v4-5 button{font-size:11.5px;padding:0 2px}'
      + '.e2v4-tipos{padding:10px 14px 0;display:flex;flex-direction:column;gap:8px;flex:none}.e2v4-tipos[hidden]{display:none}.e2v4-tipos h3{margin:0;font-size:12px;color:var(--e-mut);font-weight:700;text-transform:uppercase;letter-spacing:.04em}'
      + '.e2v4-tipos select{width:100%;height:34px;border-radius:9px;border:1px solid var(--e-borde);background:var(--e-card);color:var(--e-txt);font:inherit;padding:0 8px}'
      + '.e2v4-dock{display:flex;align-items:center;gap:14px;padding:8px 12px;flex:none;overflow-x:auto;scrollbar-width:thin}'
      + '.e2v4-grupo{display:flex;align-items:center;gap:6px;flex:none}.e2v4-motor{margin-left:auto}.e2v4-tit{display:inline-flex;align-items:center;gap:6px;margin-right:4px;color:var(--e-txt);font-size:12.5px}.e2v4-tit svg{width:18px;height:18px;color:var(--e-acc)}'
      + '.e2v4-var,.e2v4-v7{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 10px;border:1px solid var(--e-borde);border-radius:9px;background:var(--e-card);color:var(--e-txt);font:inherit;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap}'
      + '.e2v4-var:hover:not(:disabled),.e2v4-v7:hover:not(:disabled){border-color:var(--e-acc);color:var(--e-acc)}.e2v4-var.on{border-color:var(--e-acc);background:var(--accent-suave,rgba(59,130,246,.1));color:var(--e-acc)}'
      + '.e2v4-var:disabled,.e2v4-v7:disabled{opacity:.45;cursor:not-allowed}.e2v4-v7 svg{width:15px;height:15px}'
      + '.e2v4-var i{display:inline-block;border:1.5px solid currentColor;border-radius:2px;opacity:.7}.e2v4-var i[data-r=imagen_4x5]{width:10px;height:12px}.e2v4-var i[data-r=imagen_9x16]{width:8px;height:14px}.e2v4-var i[data-r=imagen_1x1]{width:11px;height:11px}'
      + '.e2v4-chip{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;background:var(--accent-suave,rgba(59,130,246,.1));color:var(--e-acc);font-size:11px;font-weight:600}'
      + '.e238.compacto .e2v4-dock{padding:5px 8px}.e238.compacto .e2v4-var,.e238.compacto .e2v4-v7{height:29px;font-size:11px}'
      + '.e2v4-check{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--e-mut,#64748b);white-space:nowrap;cursor:pointer}'
      + '.e2v4-prop{width:min(600px,100%)}.e2v4-dif{width:calc(100% - 28px);margin:12px 14px;border-collapse:collapse;font-size:13px}.e2v4-dif th{text-align:left;font-size:11.5px;color:var(--e-mut,#64748b);font-weight:650;padding:6px 8px;border-bottom:1px solid rgba(120,130,150,.25)}'
      + '.e2v4-dif td{padding:7px 8px;border-bottom:1px solid rgba(120,130,150,.14);vertical-align:top;word-break:break-word}.e2v4-si{background:var(--e-acc,#3b82f6)!important;color:#fff!important;border-color:transparent!important}'
      + '.e2v4-gota{display:grid;grid-template-columns:22px 1fr auto;gap:8px;align-items:center;font-size:12.5px}.e2v4-gota i{width:22px;height:22px;border-radius:6px;border:1px solid var(--e-borde);background-image:linear-gradient(45deg,#ddd 25%,transparent 25%,transparent 75%,#ddd 75%)}'
      + '.e2v4-gota small{display:block;color:var(--e-mut);font-size:11px}'
      + '@media(max-width:1280px){.e2v4-v7 span{display:none}.e2v4-v7{padding:0 9px}}';
    document.head.appendChild(s);
  }
  function monta() {
    const r = raiz(); if (!r || !E()) return;
    estilos(); montaIzquierda(r); montaDerecha(r); montaDock(r); montaCabecera(r);
    traePrefs().then(() => { const c = $('[data-e2v4-proponer]', r); if (c) c.checked = proponerActivo(); });
  }
  let espera = 0;
  new MutationObserver(() => { clearTimeout(espera); espera = setTimeout(monta, 220); }).observe(document.documentElement, { childList: true, subtree: true });
  window.DcarelaEditorV4 = { paridad, motor: MOTOR, aplica, propone, reparte, exportaLote: () => exportaLote(raiz()), guardaPrefs: guardaEnServidor, prefsLocales, version: 'v4-completo' };
  monta();
})();
