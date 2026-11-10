// Editor 2.0 · Etapa A — interfaz del registro de herramientas sobre el Estudio actual del CRM (no lo reemplaza: se monta encima).
//  · Registro único construido SOLO con botones reales del editor (sin herramientas de simulación): cada comando clica el botón de verdad.
//  · Paleta de comandos Ctrl+K, gestor de herramientas (perfiles, favoritos, visibilidad, orden, atajos) y preferencias por usuario FUERA del flyer.
//  · Interruptor: `localStorage.flyerEditor2Enabled = '0'` apaga todo y deja el editor como estaba. El diseño de capas no se toca.
(function () {
  'use strict';
  const C = window.DcarelaEditor2Core;
  const FLAG = 'flyerEditor2Enabled';
  try { if (!C || localStorage.getItem(FLAG) === '0') return; } catch (_) { if (!C) return; }

  // Acciones reales del Estudio (data-e238="…") que se exponen; cada una solo se registra si su botón existe.
  const ACCIONES = [
    ['deshacer', 'production', true], ['rehacer', 'production', true], ['vistaprevia', 'production'], ['guardadescarga', 'production', true],
    ['comparar', 'production'], ['formatos3', 'production'], ['biblioteca', 'layout'], ['pantalla', 'layout'], ['rejilla', 'layout'],
    ['compacto', 'layout'], ['zoomMenos', 'layout'], ['zoomMas', 'layout'], ['giraIzq', 'layout'],
  ];
  const GRUPO_HERRAMIENTA = { seleccionar: 'select', texto: 'content', textoLibre: 'content', foto: 'content', logo: 'content', formas: 'draw', degradado: 'draw', fondo: 'draw', efectos: 'style' };
  const NOMBRE_GRUPO = { select: 'Selección', content: 'Contenido', draw: 'Dibujo', layout: 'Composición', style: 'Estilo', production: 'Producción' };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (s, r) => (r || document).querySelector(s);
  const vivo = (el) => !!el && el.isConnected;
  const etiquetaDe = (el) => String(el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  const pista = (el) => ((el.getAttribute('title') || '').match(/\(([^)]+)\)\s*$/) || [])[1] || '';

  let registro = null, barraActual = null;
  const ctx = { permissions: new Set(), selectedIds: [], isReadOnly: false };
  const claveUsuario = () => { try { return C.claveDePrefs(localStorage.getItem('crm_uid') || (window.CRM_USER && (window.CRM_USER.uid || window.CRM_USER.email)) || ''); } catch (_) { return C.claveDePrefs(''); } };
  const cargaPrefs = () => { try { return JSON.parse(localStorage.getItem(claveUsuario()) || 'null'); } catch (_) { return null; } };
  const guardaPrefs = () => { try { localStorage.setItem(claveUsuario(), JSON.stringify(registro.getPreferences())); } catch (_) { /* sin almacenamiento: vale esta sesión */ } };

  function selectorDe(id) { const [tipo, clave] = id.split('.'); return tipo === 'tool' ? '[data-e238-tool="' + clave + '"]' : '[data-e238="' + clave + '"]'; }
  const botonDe = (id) => $(selectorDe(id));

  function definicion(id, grupo, el, fijo) {
    return {
      id, group: grupo, fijo: !!fijo, label: etiquetaDe(el), hint: pista(el),
      icon: () => { const b = botonDe(id) || el; const s = b && b.querySelector('svg'); return s ? s.outerHTML : ''; },
      enabled: () => { const b = botonDe(id); return !!b && !b.disabled && b.getAttribute('aria-disabled') !== 'true'; },
      run: () => { const b = botonDe(id); if (!b || b.disabled) throw new Error('El botón ya no está disponible.'); b.click(); },
    };
  }
  // Registra lo que exista en pantalla y todavía no esté; así las herramientas que el editor añade después entran sin duplicarse.
  function sincroniza(r) {
    document.querySelectorAll('[data-e238-tool]').forEach((el) => {
      const k = el.getAttribute('data-e238-tool'), id = 'tool.' + k;
      if (!r.get(id) && etiquetaDe(el)) r.register(definicion(id, GRUPO_HERRAMIENTA[k] || 'layout', el, k === 'seleccionar'));
    });
    for (const [k, grupo, fijo] of ACCIONES) { const el = $('[data-e238="' + k + '"]'); if (el && !r.get('acc.' + k)) r.register(definicion('acc.' + k, grupo, el, fijo)); }
  }

  // Aplica visibilidad, orden y favoritos a los botones reales. Idempotente.
  function aplica() {
    if (!registro) return;
    const prefs = registro.getPreferences(), hidden = new Set(prefs.hiddenIds), pinned = new Set(prefs.pinnedIds), orden = registro.list(ctx, true).map((t) => t.id);
    for (const t of registro.list(ctx, true)) {
      document.querySelectorAll(selectorDe(t.id)).forEach((el) => {
        const oculto = hidden.has(t.id);
        el.style.display = oculto ? 'none' : '';
        el.classList.toggle('e2-fav', pinned.has(t.id));
        if (t.id.startsWith('tool.')) el.style.order = String(orden.indexOf(t.id));
      });
    }
  }

  // ---------- interfaz ----------
  function estilos() {
    if ($('#e2-estilos')) return;
    const s = document.createElement('style'); s.id = 'e2-estilos';
    s.textContent = '.e2-fondo{position:fixed;inset:0;background:rgba(20,26,40,.38);z-index:99990;display:flex;align-items:flex-start;justify-content:center;padding:9vh 16px 16px}'
      + '.e2-caja{width:min(560px,100%);max-height:80vh;display:flex;flex-direction:column;background:var(--panel,#fff);color:var(--ink,#1c1c1e);border:1px solid rgba(120,130,150,.28);border-radius:14px;box-shadow:0 18px 48px rgba(20,26,40,.28);overflow:hidden;font:14px system-ui,sans-serif}'
      + '.e2-caja header{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid rgba(120,130,150,.2)}.e2-caja header b{flex:1;font-size:15px}'
      + '.e2-caja input[type=search],.e2-caja input[type=text]{width:100%;border:1px solid rgba(120,130,150,.3);border-radius:9px;padding:9px 11px;font:inherit;background:transparent;color:inherit}'
      + '.e2-lista{overflow:auto;padding:6px;margin:0;list-style:none}.e2-it{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:9px;cursor:pointer}'
      + '.e2-it[aria-selected=true]{background:var(--accent-suave,rgba(74,134,232,.13))}.e2-it[aria-disabled=true]{opacity:.45;cursor:not-allowed}'
      + '.e2-it svg{width:18px;height:18px;flex:none}.e2-it small{margin-left:auto;opacity:.6}'
      + '.e2-btn{border:1px solid rgba(120,130,150,.3);background:transparent;color:inherit;border-radius:8px;padding:6px 10px;font:inherit;cursor:pointer}.e2-btn:hover{background:var(--accent-suave,rgba(74,134,232,.13))}'
      + '.e2-btn.on{background:var(--accent,#4a86e8);color:#fff;border-color:transparent}.e2-perfiles{display:flex;gap:6px;flex-wrap:wrap;padding:10px 14px}'
      + '.e2-fila{display:grid;grid-template-columns:auto 1fr auto auto;gap:8px;align-items:center;padding:6px 14px}.e2-fila input[type=text]{width:88px;padding:5px 7px}'
      + '.e2-aviso{padding:6px 14px;color:#b3261e;font-size:12px;min-height:18px}.e2-pie{display:flex;justify-content:space-between;gap:8px;padding:10px 14px;border-top:1px solid rgba(120,130,150,.2);font-size:12px}'
      + '.e2-fav{box-shadow:inset 0 -2px 0 var(--accent,#4a86e8)}.e2-abre{margin-left:6px}.e2-caja button:focus-visible,.e2-caja input:focus-visible{outline:2px solid var(--accent,#4a86e8);outline-offset:1px}';
    document.head.appendChild(s);
  }
  function cierra() { document.querySelectorAll('.e2-fondo').forEach((n) => n.remove()); }
  function superposicion(html) {
    cierra(); estilos();
    const f = document.createElement('div'); f.className = 'e2-fondo'; f.innerHTML = '<div class="e2-caja" role="dialog" aria-modal="true">' + html + '</div>';
    f.addEventListener('mousedown', (e) => { if (e.target === f) cierra(); });
    document.body.appendChild(f); return f;
  }
  const filaPaleta = (t, i, sel) => '<li class="e2-it" role="option" data-i="' + i + '" aria-selected="' + (i === sel) + '" aria-disabled="' + (!registro.isEnabled(t, ctx)) + '">'
    + (t.icon ? t.icon() : '') + '<span>' + esc(t.label) + '</span><small>' + esc(registro.shortcutOf(t) || t.hint || NOMBRE_GRUPO[t.group]) + '</small></li>';

  function abrePaleta() {
    if (!registro) return;
    let lista = [], sel = 0;
    const f = superposicion('<header><input type="search" placeholder="Buscar una herramienta o acción…" aria-label="Buscar comando" autocomplete="off"></header><ul class="e2-lista" role="listbox"></ul>'
      + '<div class="e2-pie"><span>↑↓ elegir · Enter ejecutar · Esc cerrar</span><button class="e2-btn" data-e2-gestor type="button">Gestionar herramientas</button></div>');
    const q = $('input', f), ul = $('.e2-lista', f);
    const pinta = () => { lista = registro.search(q.value, ctx); sel = Math.min(sel, Math.max(0, lista.length - 1)); ul.innerHTML = lista.length ? lista.map((t, i) => filaPaleta(t, i, sel)).join('') : '<li class="e2-it" aria-disabled="true">Nada coincide.</li>'; };
    const ejecuta = async (i) => { const t = lista[i]; if (!t || !registro.isEnabled(t, ctx)) return; cierra(); try { await registro.execute(t.id, undefined, ctx); } catch (_) { /* el botón real avisa en su propio flujo */ } };
    q.addEventListener('input', () => { sel = 0; pinta(); });
    q.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + lista.length) % Math.max(1, lista.length); pinta(); const a = $('[aria-selected=true]', ul); if (a) a.scrollIntoView({ block: 'nearest' }); }
      else if (e.key === 'Enter') { e.preventDefault(); ejecuta(sel); } else if (e.key === 'Escape') { e.preventDefault(); cierra(); }
    });
    ul.addEventListener('click', (e) => { const li = e.target.closest('.e2-it[data-i]'); if (li) ejecuta(Number(li.dataset.i)); });
    $('[data-e2-gestor]', f).addEventListener('click', abreGestor);
    pinta(); q.focus();
  }

  function abreGestor() {
    if (!registro) return;
    const pinta = (aviso) => {
      const prefs = registro.getPreferences(), hidden = new Set(prefs.hiddenIds), pinned = new Set(prefs.pinnedIds);
      const filas = registro.list(ctx, true).map((t, i, a) => '<div class="e2-fila" data-id="' + esc(t.id) + '">'
        + '<button class="e2-btn' + (pinned.has(t.id) ? ' on' : '') + '" data-e2-fav type="button" aria-pressed="' + pinned.has(t.id) + '" title="Favorita (sube al inicio)" aria-label="Favorita ' + esc(t.label) + '">★</button>'
        + '<label style="display:flex;gap:8px;align-items:center">' + (t.icon ? t.icon() : '') + '<input type="checkbox" data-e2-vis ' + (hidden.has(t.id) ? '' : 'checked') + (t.fijo ? ' disabled title="Esta acción no se puede ocultar"' : '') + '> ' + esc(t.label) + '</label>'
        + '<input type="text" data-e2-atajo value="' + esc(registro.shortcutOf(t)) + '" placeholder="Atajo" aria-label="Atajo de ' + esc(t.label) + '">'
        + '<span><button class="e2-btn" data-e2-mueve="-1" type="button" aria-label="Subir"' + (i === 0 ? ' disabled' : '') + '>↑</button> <button class="e2-btn" data-e2-mueve="1" type="button" aria-label="Bajar"' + (i === a.length - 1 ? ' disabled' : '') + '>↓</button></span></div>').join('');
      const caja = $('.e2-caja'); if (!caja) return;
      caja.innerHTML = '<header><b>Herramientas del editor</b><button class="e2-btn" data-e2-cerrar type="button">Cerrar</button></header>'
        + '<div class="e2-perfiles">' + [['completo', 'Completo'], ['esencial', 'Esencial'], ['tipografia', 'Tipografía'], ['mosaicos', 'Mosaicos']].map(([k, n]) => '<button class="e2-btn' + (prefs.perfil === k ? ' on' : '') + '" data-e2-perfil="' + k + '" type="button">' + n + '</button>').join('')
        + (prefs.perfil === 'personal' ? '<span style="align-self:center;opacity:.6">Personalizado</span>' : '') + '</div>'
        + '<div class="e2-aviso" role="alert">' + esc(aviso || '') + '</div><div class="e2-lista" style="overflow:auto">' + filas + '</div>'
        + '<div class="e2-pie"><span>Se guarda para ti, no dentro del flyer.</span><span><button class="e2-btn" data-e2-reset type="button">Restablecer</button> <button class="e2-btn" data-e2-viejo type="button" title="Vuelve al editor anterior">Volver al editor anterior</button></span></div>';
    };
    const f = superposicion(''); pinta();
    const salva = (aviso) => { guardaPrefs(); aplica(); pinta(aviso); };
    f.addEventListener('click', (e) => {
      const fila = e.target.closest('.e2-fila'), id = fila && fila.dataset.id;
      if (e.target.closest('[data-e2-cerrar]')) cierra();
      else if (e.target.closest('[data-e2-fav]')) { registro.toggle(id, 'pinned'); salva(); }
      else if (e.target.closest('[data-e2-mueve]')) { registro.move(id, Number(e.target.closest('[data-e2-mueve]').dataset.e2Mueve)); salva(); }
      else if (e.target.closest('[data-e2-perfil]')) { registro.applyProfile(e.target.closest('[data-e2-perfil]').dataset.e2Perfil); salva(); }
      else if (e.target.closest('[data-e2-reset]')) { registro.setPreferences({ orderedIds: [], hiddenIds: [], pinnedIds: [], shortcutOverrides: {}, perfil: 'completo' }); salva(); }
      else if (e.target.closest('[data-e2-viejo]')) { try { localStorage.setItem(FLAG, '0'); } catch (_) { /* nada */ } location.reload(); }
    });
    f.addEventListener('change', (e) => {
      const fila = e.target.closest('.e2-fila'), id = fila && fila.dataset.id;
      if (e.target.matches('[data-e2-vis]')) { registro.toggle(id, 'hidden'); salva(); }
      else if (e.target.matches('[data-e2-atajo]')) { const err = registro.setShortcut(id, e.target.value); salva(err || ''); }
    });
    f.addEventListener('keydown', (e) => { if (e.key === 'Escape') cierra(); });
  }

  function botonGestor(barra) {
    if ($('[data-e2-abre]', barra)) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'e238-btn e238-peq e2-abre'; b.setAttribute('data-e2-abre', '1');
    b.title = 'Paleta de comandos (Ctrl+K) y gestor de herramientas'; b.setAttribute('aria-label', 'Herramientas y comandos'); b.innerHTML = '<span>Ctrl+K</span>';
    b.addEventListener('click', abrePaleta); barra.appendChild(b);
  }

  function monta() {
    const barra = $('.e238-barra');
    if (!barra) { registro = null; barraActual = null; return; }
    if (!registro || barraActual !== barra) {
      registro = new C.ToolRegistry(); sincroniza(registro);
      const p = cargaPrefs(); if (p) registro.setPreferences(p);
      barraActual = barra;
    } else { const antes = registro.tools.size; sincroniza(registro); if (registro.tools.size !== antes) registro.setPreferences({}); }
    botonGestor(barra); aplica();
  }

  let espera = 0;
  new MutationObserver(() => { clearTimeout(espera); espera = setTimeout(monta, 150); }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('keydown', (e) => {
    if (!registro || !$('.e238-barra')) return;
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && String(e.key).toLowerCase() === 'k') { e.preventDefault(); abrePaleta(); return; }
    if ($('.e2-fondo')) return;
    const combo = C.comboDeEvento(e); if (!combo) return;
    const t = registro.resolveShortcut(combo, ctx);
    if (t) { e.preventDefault(); registro.execute(t.id, undefined, ctx).catch(() => {}); }
  });
  window.DcarelaEditor2 = { abrePaleta, abreGestor, registro: () => registro, version: 'etapa-A' };
  monta();
})();
