// Editor 2.0 — núcleo del registro de herramientas (kit DCARELA_Editor_Flyers_2_0, «src/core/tool-registry.ts», portado a JS sin dependencias).
// Una sola fuente de comandos: id, etiqueta, grupo, atajo, estado y acción. NO crea botones ni toca el DOM: la interfaz lo consume.
// Reglas del kit que se cumplen aquí: sin comandos huérfanos (solo existe lo que se registra con una acción real), preferencias por usuario
// separadas del documento, perfiles Esencial / Tipografía / Mosaicos / Completo, y atajos que nunca se disparan mientras se escribe.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DcarelaEditor2Core = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const GRUPOS = ['select', 'content', 'draw', 'layout', 'style', 'production'];
  const PERFILES = {
    // `null` = todo visible. Las claves son ids reales de herramientas; los que no existan simplemente no cuentan.
    completo: null,
    esencial: ['tool.seleccionar', 'tool.foto', 'tool.texto', 'tool.formas', 'tool.mosaico', 'acc.deshacer', 'acc.rehacer', 'acc.vistaprevia', 'acc.guardadescarga'],
    tipografia: ['tool.seleccionar', 'tool.texto', 'tool.textoLibre', 'tool.efectos', 'tool.capas', 'acc.deshacer', 'acc.rehacer', 'acc.rejilla', 'acc.vistaprevia'],
    mosaicos: ['tool.seleccionar', 'tool.foto', 'tool.mosaico', 'tool.ajustar', 'tool.sujeto', 'acc.deshacer', 'acc.rehacer', 'acc.rejilla', 'acc.vistaprevia'],
  };
  const PERFILES_VALIDOS = [...Object.keys(PERFILES), 'personal'];
  const PREFS_VACIAS = () => ({ orderedIds: [], hiddenIds: [], pinnedIds: [], shortcutOverrides: {}, perfil: 'completo' });
  const normaliza = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  // «shift+ctrl+k» -> «Ctrl+Shift+K»: forma canónica comparable.
  const atajo = (s) => {
    const partes = String(s || '').split('+').map((p) => p.trim()).filter(Boolean)
      .map((p) => (p.length === 1 ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1).toLowerCase()));
    const peso = (p) => (p === 'Ctrl' ? 0 : p === 'Shift' ? 1 : 2);
    return partes.sort((a, b) => peso(a) - peso(b)).join('+');
  };
  const RESERVADOS = new Set(['Ctrl+K', 'Ctrl+Z', 'Ctrl+Y', 'Ctrl+C', 'Ctrl+V', 'Ctrl+X', 'Ctrl+A', 'Ctrl+S', 'Delete', 'Backspace', 'Escape', 'Enter', 'Tab', 'Space']);

  class ToolRegistry {
    constructor() { this.tools = new Map(); this.prefs = PREFS_VACIAS(); }
    register(def) {
      if (!def || !def.id || typeof def.run !== 'function') throw new Error('Una herramienta necesita id y una acción real.');
      if (this.tools.has(def.id)) throw new Error('Herramienta duplicada: ' + def.id);
      if (!GRUPOS.includes(def.group)) throw new Error('Grupo no válido: ' + def.group);
      this.tools.set(def.id, def);
      if (!this.prefs.orderedIds.includes(def.id)) this.prefs.orderedIds.push(def.id);
      return this;
    }
    // Descarta lo que ya no existe y conserva lo demás.
    setPreferences(input) {
      const p = { ...this.prefs, ...(input || {}) }, existe = (id) => this.tools.has(id);
      this.prefs = {
        orderedIds: [...new Set([...(p.orderedIds || []).filter(existe), ...this.tools.keys()])],
        hiddenIds: [...new Set(p.hiddenIds || [])].filter(existe),
        pinnedIds: [...new Set(p.pinnedIds || [])].filter(existe),
        shortcutOverrides: Object.fromEntries(Object.entries(p.shortcutOverrides || {}).filter(([id, v]) => existe(id) && typeof v === 'string' && v).map(([id, v]) => [id, atajo(v)])),
        perfil: PERFILES_VALIDOS.includes(p.perfil) ? p.perfil : 'completo',
      };
      return this;
    }
    getPreferences() { return JSON.parse(JSON.stringify(this.prefs)); }
    isEnabled(t, ctx) { return !(t.enabled && !t.enabled(ctx || {})); }
    isAllowed(t, ctx) { return !(t.permission && !(ctx && ctx.permissions && ctx.permissions.has(t.permission))) && !(t.isVisible && !t.isVisible(ctx || {})); }
    // Orden del usuario con favoritos primero; `incluirOcultas` sirve al gestor y a la paleta.
    list(ctx, incluirOcultas = false) {
      const hidden = new Set(this.prefs.hiddenIds), pinned = new Set(this.prefs.pinnedIds);
      const todas = this.prefs.orderedIds.map((id) => this.tools.get(id)).filter((t) => t && this.isAllowed(t, ctx) && (incluirOcultas || !hidden.has(t.id)));
      return [...todas.filter((t) => pinned.has(t.id)), ...todas.filter((t) => !pinned.has(t.id))];
    }
    get(id) { return this.tools.get(id); }
    shortcutOf(t) { return atajo(this.prefs.shortcutOverrides[t.id] || t.shortcut || ''); }
    resolveShortcut(combo, ctx) { const n = atajo(combo); return n ? this.list(ctx).find((t) => this.shortcutOf(t) === n && this.isEnabled(t, ctx)) : undefined; }
    // Búsqueda sin tildes por nombre, id o descripción, empezando por las coincidencias más directas.
    search(q, ctx) {
      const n = normaliza(q), todas = this.list(ctx, true);
      if (!n) return todas;
      return todas.map((t) => {
        const c = [normaliza(t.label), normaliza(t.id), normaliza(t.description)];
        return { t, k: c[0].startsWith(n) ? 0 : c[0].includes(n) ? 1 : c[1].includes(n) ? 2 : c[2].includes(n) ? 3 : -1 };
      }).filter((x) => x.k >= 0).sort((a, b) => a.k - b.k).map((x) => x.t);
    }
    async execute(id, payload, ctx) {
      const t = this.tools.get(id);
      if (!t) throw new Error('Herramienta inexistente: ' + id);
      if (!this.isAllowed(t, ctx) || !this.isEnabled(t, ctx)) throw new Error('Acción no disponible');
      return t.run(payload, ctx);
    }
    // --- gestión por usuario ---
    toggle(id, tipo) {
      if (!this.tools.has(id)) return this;
      // Las acciones «fijas» (Guardar, Deshacer…) nunca se pueden ocultar: sin ellas el editor queda inservible.
      if (tipo !== 'pinned' && this.tools.get(id).fijo) return this;
      const campo = tipo === 'pinned' ? 'pinnedIds' : 'hiddenIds', a = this.prefs[campo];
      this.prefs[campo] = a.includes(id) ? a.filter((x) => x !== id) : [...a, id];
      this.prefs.perfil = 'personal';
      return this;
    }
    move(id, delta) {
      const o = this.prefs.orderedIds, a = o.indexOf(id), b = a + (delta < 0 ? -1 : 1);
      if (a < 0 || b < 0 || b >= o.length) return this;
      [o[a], o[b]] = [o[b], o[a]]; this.prefs.perfil = 'personal'; return this;
    }
    // Devuelve un texto de error si el atajo choca; si no, lo guarda (o lo quita si viene vacío).
    setShortcut(id, combo) {
      if (!this.tools.has(id)) return 'Herramienta inexistente.';
      const n = atajo(combo);
      if (!n) { delete this.prefs.shortcutOverrides[id]; return null; }
      if (RESERVADOS.has(n)) return 'Ese atajo ya lo usa el editor o el navegador.';
      for (const t of this.tools.values()) if (t.id !== id && this.shortcutOf(t) === n) return 'Ya lo usa «' + t.label + '».';
      this.prefs.shortcutOverrides[id] = n; return null;
    }
    applyProfile(nombre) {
      if (!(nombre in PERFILES)) return this;
      const set = PERFILES[nombre];
      this.prefs.hiddenIds = set ? [...this.tools.keys()].filter((id) => !set.includes(id) && !this.tools.get(id).fijo) : [];
      this.prefs.perfil = nombre; return this;
    }
  }

  // «Ctrl+Shift+K» a partir de un KeyboardEvent. Nunca dispara con el foco en un campo de texto o con un texto del lienzo en edición.
  function comboDeEvento(e) {
    const t = e && e.target, tag = String((t && t.tagName) || '').toUpperCase();
    if (!e || e.altKey || e.metaKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || (t && t.isContentEditable)) return '';
    const tecla = e.key === ' ' ? 'Space' : String(e.key || '');
    if (['Control', 'Shift', 'Alt', 'Meta', ''].includes(tecla)) return '';
    return [e.ctrlKey ? 'Ctrl' : null, e.shiftKey ? 'Shift' : null, tecla.length === 1 ? tecla.toUpperCase() : tecla].filter(Boolean).join('+');
  }
  const claveDePrefs = (uid) => 'editor2-tools:' + String(uid || 'anonimo').replace(/[^\w.@-]/g, '_').slice(0, 80);

  return { ToolRegistry, PERFILES, GRUPOS, atajo, comboDeEvento, normaliza, claveDePrefs, RESERVADOS };
});
