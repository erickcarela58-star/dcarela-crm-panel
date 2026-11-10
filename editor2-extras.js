// Editor 2.0 · Etapa B — funciones nuevas sobre el Estudio real (no lo reemplaza ni toca el panel de capas):
//  · «Motor V7»: menú con seis acciones reales (recomponer, conservar, restaurar, variar plantilla, 3 formatos, revisar).
//  · Revisión antes de exportar: lee las cajas que dibujó el motor y avisa de márgenes, letra chica, textos montados y exceso de texto.
//  · Puntos de restauración: guarda el diseño con nombre y lo recupera después (queda en el historial: Ctrl+Z lo deshace).
// Cada comando llama a la API real del editor (`form.__api238`) o al botón real. Si algo no existe, el comando sale deshabilitado: nada simulado.
// Interruptor: el mismo de la etapa A (`localStorage.flyerEditor2Enabled = '0'`).
(function () {
  'use strict';
  const X = window.DcarelaEditor2ExtrasCore;
  try { if (!X || localStorage.getItem('flyerEditor2Enabled') === '0') return; } catch (_) { if (!X) return; }
  const DIM = { imagen_4x5: [1080, 1350], imagen_1x1: [1080, 1080], imagen_9x16: [1080, 1920], imagen_16x9: [1920, 1080] };
  const CLAVE = 'dcarela.editor2.puntos.v1';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (s, r) => (r || document).querySelector(s);
  const formulario = () => [...document.querySelectorAll('form')].find((f) => f.__api238 && f.isConnected) || null;
  const api = () => { const f = formulario(); return f ? f.__api238 : null; };
  const boton = (k) => $('[data-e238="' + k + '"]');
  const svg = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  const ICONO = {
    motor: svg('<path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'),
    revisar: svg('<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>'),
    guardar: svg('<path d="M6 3h12v18l-6-4-6 4z"/>'),
    volver: svg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v4l3 2"/>'),
    girar: svg('<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>'),
    siguiente: svg('<rect x="3" y="4" width="11" height="16" rx="2"/><path d="M17 8l4 4-4 4"/>'),
    formatos: svg('<rect x="3" y="5" width="7" height="9" rx="1.5"/><rect x="12" y="3" width="5" height="9" rx="1.5"/><rect x="12" y="15" width="9" height="6" rx="1.5"/>'),
  };

  // ---------- puntos de restauración ----------
  const leePuntos = () => { try { return JSON.parse(localStorage.getItem(CLAVE) || '[]'); } catch (_) { return []; } };
  const guardaPuntos = (l) => { try { localStorage.setItem(CLAVE, JSON.stringify(l)); return true; } catch (_) { return false; } };
  function conserva(nombre) {
    const a = api(); if (!a) throw new Error('El editor no está abierto.');
    const antes = leePuntos(), puntos = X.agregaPunto(antes, { plantilla: a.idReal, nombre: nombre || 'Diseño de las ' + new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }), valores: a.valores() });
    if (puntos === antes) return { ok: true, repetido: true };
    return { ok: guardaPuntos(puntos), total: X.puntosDe(puntos, a.idReal).length };
  }
  // Devuelve los valores guardados al formulario real y pide la vista al motor. Queda como un paso del historial.
  function restaura(punto) {
    const f = formulario(), a = api(); if (!f || !a) throw new Error('El editor no está abierto.');
    if (punto.plantilla !== a.idReal) throw new Error('Ese diseño es de otra plantilla.');
    a.guardaHistorial();
    let cambiados = 0;
    for (const [k, v] of Object.entries(punto.valores)) {
      const el = f.elements[k]; if (!el || el.type === 'file') continue;
      if (el.type === 'checkbox') { const on = !(v === '' || v === false || v === 'no' || v === '0'); if (el.checked !== on) { el.checked = on; cambiados++; } continue; }
      if (String(el.value) !== String(v)) { el.value = String(v); cambiados++; }
    }
    if (cambiados) { try { a.sincroniza(); } catch (_) { /* la vista se recompone igual */ } a.guardaHistorial(); a.programaVista(0); }
    return cambiados;
  }

  // ---------- revisión antes de exportar ----------
  function revisa() {
    const a = api(); if (!a) return [{ nivel: 'error', texto: 'El editor no está abierto.' }];
    let motor = null, valores = {}, fotos = [];
    try { motor = a.ultimoMotor(); } catch (_) { /* aún sin vista */ }
    try { valores = a.valores(); } catch (_) { /* nada */ }
    try { fotos = a.originalesUsadas() || []; } catch (_) { /* nada */ }
    const f = formulario(), formato = (f && f.elements._formato && f.elements._formato.value) || valores._formato;
    const [ancho, alto] = DIM[formato] || DIM.imagen_4x5;
    return X.revisa({ cajas: Array.isArray(motor) ? motor[0] : [], ancho, alto, fotos });
  }

  // ---------- interfaz ----------
  function estilos() {
    if ($('#e2x-estilos')) return;
    const s = document.createElement('style'); s.id = 'e2x-estilos';
    s.textContent = '.e2x-dock{position:relative;margin-left:auto}.e2x-dock>button{display:inline-flex;align-items:center;gap:6px}.e2x-dock>button svg,.e2x-menu svg{width:16px;height:16px;flex:none}'
      + '.e2x-menu{position:absolute;right:0;bottom:calc(100% + 8px);z-index:60;min-width:270px;padding:6px;background:var(--panel,#fff);color:var(--ink,#1c1c1e);border:1px solid rgba(120,130,150,.28);border-radius:12px;box-shadow:0 14px 36px rgba(20,26,40,.22);font:13.5px system-ui,sans-serif}'
      + '.e2x-menu button{display:flex;align-items:center;gap:9px;width:100%;border:0;background:transparent;color:inherit;text-align:left;padding:8px 10px;border-radius:8px;font:inherit;cursor:pointer}.e2x-menu button:hover:not(:disabled),.e2x-menu button:focus-visible{background:var(--accent-suave,rgba(74,134,232,.13));outline:0}.e2x-menu button:disabled{opacity:.45;cursor:not-allowed}.e2x-menu small{display:block;opacity:.62;font-size:11.5px}'
      + '.e2x-lista{list-style:none;margin:0;padding:8px 14px 14px;overflow:auto}.e2x-lista li{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid rgba(120,130,150,.16)}.e2x-lista li:last-child{border-bottom:0}'
      + '.e2x-nivel{flex:none;font-size:11px;font-weight:700;border-radius:999px;padding:2px 8px;margin-top:1px}.e2x-nivel[data-n=error]{background:#fde8e8;color:#b3261e}.e2x-nivel[data-n=aviso]{background:#fff3d6;color:#8a5a00}.e2x-nivel[data-n=bien]{background:#dcf5e7;color:#0f6b3f}'
      + '.e2x-punto{display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid rgba(120,130,150,.16)}.e2x-punto b{flex:1;font-weight:600}.e2x-punto small{opacity:.6;font-weight:400}.e2x-vacio{padding:18px 14px;opacity:.7}';
    document.head.appendChild(s);
  }
  function dialogo(titulo, cuerpo) {
    estilos(); document.querySelectorAll('.e2-fondo').forEach((n) => n.remove());
    const f = document.createElement('div'); f.className = 'e2-fondo';
    f.innerHTML = '<div class="e2-caja" role="dialog" aria-modal="true" aria-label="' + esc(titulo) + '"><header><b>' + esc(titulo) + '</b><button class="e2-btn" data-e2x-cerrar type="button">Cerrar</button></header>' + cuerpo + '</div>';
    f.addEventListener('mousedown', (e) => { if (e.target === f) f.remove(); });
    f.addEventListener('click', (e) => { if (e.target.closest('[data-e2x-cerrar]')) f.remove(); });
    f.addEventListener('keydown', (e) => { if (e.key === 'Escape') f.remove(); });
    document.body.appendChild(f); const b = $('[data-e2x-cerrar]', f); if (b) b.focus();
    return f;
  }
  function aviso(texto) { const b = $('[data-e238-estado]'); if (b) { b.dataset.tipo = 'aviso'; b.innerHTML = '<span>' + esc(texto) + '</span>'; b.hidden = false; } }

  function abreRevision() {
    const r = revisa(), n = X.resumen(r);
    const cab = n.errores ? n.errores + ' problema(s) que conviene arreglar' + (n.avisos ? ' y ' + n.avisos + ' aviso(s)' : '') : n.avisos ? n.avisos + ' aviso(s); puedes exportar igual' : 'Listo para exportar';
    const f = dialogo('Revisión antes de exportar', '<div class="e2-perfiles" style="padding-bottom:0"><span>' + esc(cab) + '</span></div><ul class="e2x-lista">'
      + r.map((x) => '<li><span class="e2x-nivel" data-n="' + x.nivel + '">' + (x.nivel === 'error' ? 'Arreglar' : x.nivel === 'aviso' ? 'Aviso' : 'Bien') + '</span><span>' + esc(x.texto) + '</span></li>').join('')
      + '</ul><div class="e2-pie"><span>Se revisa la vista exacta del motor, no una aproximación.</span><button class="e2-btn" data-e2x-otra type="button">Revisar otra vez</button></div>');
    $('[data-e2x-otra]', f).addEventListener('click', abreRevision);
    return r;
  }
  function abrePuntos() {
    const a = api(); if (!a) return;
    const pinta = () => {
      const mios = X.puntosDe(leePuntos(), a.idReal), ahora = a.valores();
      return mios.length ? mios.map((p, i) => '<div class="e2x-punto" data-i="' + i + '"><b>' + esc(p.nombre) + '<br><small>' + esc(new Date(p.cuando).toLocaleString('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })) + ' · ' + X.diferencias(p.valores, ahora).length + ' ajuste(s) distintos del actual</small></b>'
        + '<button class="e2-btn" data-e2x-usar type="button">Restaurar</button><button class="e2-btn" data-e2x-borrar type="button" aria-label="Borrar ' + esc(p.nombre) + '">Borrar</button></div>').join('')
        : '<div class="e2x-vacio">Todavía no has conservado ningún diseño de esta plantilla. Usa «Conservar este diseño» antes de probar cambios grandes.</div>';
    };
    const f = dialogo('Diseños conservados de esta plantilla', '<div data-e2x-cuerpo>' + pinta() + '</div><div class="e2-pie"><span>Se guardan en este equipo, fuera del flyer.</span><button class="e2-btn" data-e2x-nuevo type="button">Conservar el diseño actual</button></div>');
    f.addEventListener('click', (e) => {
      const fila = e.target.closest('.e2x-punto'), mios = X.puntosDe(leePuntos(), a.idReal), p = fila && mios[Number(fila.dataset.i)];
      if (e.target.closest('[data-e2x-usar]') && p) { let n = 0; try { n = restaura(p); } catch (err) { aviso(err.message); } f.remove(); aviso(n ? 'Diseño «' + p.nombre + '» restaurado (' + n + ' ajustes). Ctrl+Z lo deshace.' : 'Ese diseño ya es el actual.'); }
      else if (e.target.closest('[data-e2x-borrar]') && p) { guardaPuntos(leePuntos().filter((q) => !(q.plantilla === p.plantilla && q.cuando === p.cuando))); $('[data-e2x-cuerpo]', f).innerHTML = pinta(); }
      else if (e.target.closest('[data-e2x-nuevo]')) { try { conserva(); } catch (err) { aviso(err.message); } $('[data-e2x-cuerpo]', f).innerHTML = pinta(); }
    });
  }

  // Las seis acciones del menú «Motor V7». `puede` decide si sale habilitada; `hace` llama a la API o al botón real.
  const ACCIONES = [
    { id: 'e2.recomponer', label: 'Recomponer con el motor', nota: 'Vuelve a pedir la vista exacta', icono: ICONO.girar, puede: () => !!api(), hace: () => api().previsualiza() },
    { id: 'e2.conservar', label: 'Conservar este diseño', nota: 'Punto de restauración con la hora', icono: ICONO.guardar, puede: () => !!api(), hace: () => { const r = conserva(); aviso(r.repetido ? 'Ese diseño ya estaba conservado.' : r.ok ? 'Diseño conservado. Lo recuperas en «Restaurar un diseño».' : 'No se pudo guardar en este equipo.'); } },
    { id: 'e2.restaurar', label: 'Restaurar un diseño conservado…', nota: 'Lista de diseños guardados', icono: ICONO.volver, puede: () => !!api(), hace: abrePuntos },
    { id: 'e2.variar', label: 'Probar la siguiente plantilla', nota: 'De la misma serie, con tu foto y textos', icono: ICONO.siguiente, puede: () => { const a = api(); return !!a && !!X.siguientePlantilla(a.lista, a.idReal); }, hace: () => { const a = api(); try { conserva('Antes de cambiar de plantilla'); } catch (_) { /* sin almacenamiento */ } a.abrirPlantilla(X.siguientePlantilla(a.lista, a.idReal)); } },
    { id: 'e2.formatos', label: 'Adaptar a los 3 formatos', nota: '4:5, 1:1 y 9:16 con el mismo diseño', icono: ICONO.formatos, puede: () => { const b = boton('formatos3'); return !!b && !b.disabled; }, hace: () => boton('formatos3').click() },
    { id: 'e2.revisar', label: 'Revisar antes de exportar', nota: 'Márgenes, letra, textos montados', icono: ICONO.revisar, puede: () => !!api(), hace: abreRevision },
  ];
  // Definiciones para la paleta Ctrl+K y el gestor (las registra editor2-tools.js). Son fijas: ningún perfil las esconde.
  const comandos = () => ACCIONES.map((x) => ({ id: x.id, group: 'motor', fijo: true, label: x.label, hint: 'Motor V7', icon: () => x.icono, enabled: x.puede, run: x.hace }));

  function cierraMenu() { document.querySelectorAll('.e2x-menu').forEach((n) => n.remove()); const b = $('[data-e2x-dock]'); if (b) b.setAttribute('aria-expanded', 'false'); }
  function abreMenu(ancla) {
    if ($('.e2x-menu')) { cierraMenu(); return; }
    const m = document.createElement('div'); m.className = 'e2x-menu'; m.setAttribute('role', 'menu');
    m.innerHTML = ACCIONES.map((x, i) => '<button type="button" role="menuitem" data-i="' + i + '"' + (x.puede() ? '' : ' disabled') + '>' + x.icono + '<span>' + esc(x.label) + '<small>' + esc(x.nota) + '</small></span></button>').join('');
    m.addEventListener('click', (e) => { const b = e.target.closest('button[data-i]'); if (!b || b.disabled) return; cierraMenu(); try { ACCIONES[Number(b.dataset.i)].hace(); } catch (err) { aviso(err.message || 'No se pudo.'); } });
    m.addEventListener('keydown', (e) => { if (e.key === 'Escape') { cierraMenu(); ancla.focus(); } });
    ancla.parentNode.appendChild(m); ancla.setAttribute('aria-expanded', 'true'); const p = $('button:not(:disabled)', m); if (p) p.focus();
  }
  function monta() {
    const pie = $('.e238-pie');
    if (!pie || $('[data-e2x-dock]', pie)) return;
    estilos();
    const caja = document.createElement('div'); caja.className = 'e2x-dock';
    caja.innerHTML = '<button type="button" class="e238-btn e238-peq" data-e2x-dock aria-haspopup="menu" aria-expanded="false" title="Acciones del motor V7: recomponer, conservar, restaurar, variar plantilla, 3 formatos y revisión">' + ICONO.motor + '<span>Motor V7</span></button>';
    $('button', caja).addEventListener('click', (e) => abreMenu(e.currentTarget));
    pie.appendChild(caja);
  }
  document.addEventListener('mousedown', (e) => { if ($('.e2x-menu') && !e.target.closest('.e2x-dock')) cierraMenu(); });
  let espera = 0;
  new MutationObserver(() => { clearTimeout(espera); espera = setTimeout(monta, 200); }).observe(document.documentElement, { childList: true, subtree: true });
  window.DcarelaEditor2Extras = { comandos, revisa, conserva, restaura, abreRevision, abrePuntos, puntos: leePuntos, version: 'etapa-B' };
  monta();
})();
