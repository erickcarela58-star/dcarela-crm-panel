(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SaleAdsCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const templates = [
    ["T01", "Hito local a WhatsApp", ["birthday", "xv", "graduation", "family"], ["cold", "warm"], "qualified_lead", "WhatsApp", ["feed_portrait", "fullscreen_vertical", "marketplace_square"], "Costo por sesión completada", "Hipótesis local; validar reservas reales", "No usar atributos personales"],
    ["T02", "Espacios estacionales reales", ["christmas", "mothers", "graduation", "mini", "documents"], ["cold", "warm", "remarketing"], "booking", "WhatsApp", ["feed_portrait", "fullscreen_vertical"], "Costo por reserva", "Solo con cupos y fecha verificados", "Prohibida la escasez ficticia"],
    ["T03", "Detrás de cámara a resultado", ["birthday", "maternity", "xv", "portrait", "corporate"], ["cold", "warm"], "qualified_lead", "WhatsApp", ["feed_portrait", "fullscreen_vertical"], "Costo por sesión completada", "Demostración del proceso real", "Exige release y música licenciada"],
    ["T04", "Guía de poses", ["maternity", "portrait", "xv"], ["cold", "warm"], "qualified_lead", "WhatsApp", ["feed_portrait", "fullscreen_vertical"], "Costo por lead calificado", "Resolver objeción sin diagnosticar al público", "No afirmar inseguridad o apariencia"],
    ["T05", "Prueba social verificable", ["maternity", "newborn", "wedding", "family", "corporate"], ["warm", "remarketing"], "booking", "WhatsApp", ["feed_portrait", "fullscreen_vertical"], "Costo por sesión completada", "Testimonio y resultado con autorización", "No inventar clientes ni reseñas"],
    ["T06", "Portafolio carrusel", ["birthday", "graduation", "xv", "wedding", "family", "corporate"], ["cold", "warm"], "qualified_lead", "Web o WhatsApp", ["feed_portrait", "marketplace_square"], "Costo por reserva", "Una sola promesa por carrusel", "No mezclar servicios incompatibles"],
    ["T07", "Consulta de alto valor", ["wedding", "xv", "branding", "event", "corporate"], ["warm", "hot"], "qualified_lead", "Formulario o WhatsApp", ["feed_portrait", "fullscreen_vertical"], "Costo por lead calificado", "Calificación antes de cotizar", "Minimizar datos solicitados"],
    ["T08", "Formulario instantáneo calificado", ["general"], ["cold", "warm"], "qualified_lead", "Instant Form", ["feed_portrait", "fullscreen_vertical"], "Costo por lead calificado", "Usar si WhatsApp trae baja intención", "Medir calidad, no formularios enviados"],
    ["T09", "Reactivación consentida", ["family", "baby", "corporate", "general"], ["loyalty"], "booking", "WhatsApp", ["feed_portrait"], "Costo por sesión completada", "Solo clientes con consentimiento vigente", "Excluir opt-out y reservas activas"],
    ["T10", "Retargeting de decisión", ["general"], ["remarketing", "hot"], "booking", "Web o WhatsApp", ["feed_portrait", "fullscreen_vertical"], "Costo por reserva", "Aclarar objeción o siguiente paso", "Controlar frecuencia y excluir convertidos"],
    ["T11", "Experiencia del estudio", ["portrait", "maternity", "corporate", "general"], ["cold", "warm"], "qualified_lead", "WhatsApp", ["feed_portrait", "fullscreen_vertical"], "Costo por sesión completada", "Mostrar recursos realmente disponibles", "No prometer utilería inexistente"],
    ["T12", "Oferta simple de baja fricción", ["documents", "mini", "frames", "prints"], ["cold", "warm", "hot"], "paid_order", "Web o WhatsApp", ["feed_portrait", "marketplace_square"], "ROAS de contribución", "Precio y entregables exactos", "Destino, precio y vigencia deben coincidir"],
  ].map(([id, name, services, stages, goal, destination, assets, metric, evidence, risk]) => ({
    id, version: 1, name, services, stages, goal, destination, required_assets: assets,
    primary_metric: metric, evidence, risk, active: true,
  }));

  const creativeSpecs = [
    { id: "feed_portrait", label: "Feed FB/IG", ratio: "4:5", width: 1440, height: 1800, placements: ["facebook_feed", "instagram_feed", "instagram_explore"], source: "https://www.facebook.com/business/ads-guide/update", verified_at: "2026-08-23", verification_status: "baseline_requires_authenticated_recheck" },
    { id: "fullscreen_vertical", label: "Stories y Reels", ratio: "9:16", width: 1080, height: 1920, placements: ["facebook_stories", "instagram_stories", "facebook_reels", "instagram_reels"], safe_zone: { top_pct: 14, bottom_pct: 35, left_pct: 6, right_pct: 6 }, source: "https://www.facebook.com/business/ads-guide/update", verified_at: "2026-08-23", verification_status: "baseline_requires_authenticated_recheck" },
    { id: "marketplace_square", label: "Marketplace", ratio: "1:1", width: 1080, height: 1080, placements: ["facebook_marketplace"], source: "https://www.facebook.com/business/ads-guide/update", verified_at: "2026-08-23", verification_status: "baseline_requires_authenticated_recheck" },
  ];

  const n = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const clamp01 = (value) => Math.max(0, Math.min(1, n(value)));
  const round2 = (value) => Math.round((n(value) + Number.EPSILON) * 100) / 100;

  function recommendTemplates(input = {}) {
    const service = String(input.service || "general").toLowerCase();
    const stage = String(input.stage || "cold").toLowerCase();
    return templates
      .map((template) => ({
        ...template,
        score: (template.services.includes(service) ? 4 : template.services.includes("general") ? 1 : 0)
          + (template.stages.includes(stage) ? 3 : 0),
      }))
      .filter((template) => template.score > 0)
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      .slice(0, 3);
  }

  function calculateBudget(input = {}) {
    const price = n(input.price);
    const variableCost = n(input.variable_cost);
    const desiredProfit = n(input.desired_profit_after_ads);
    const targetRoas = Math.max(0, n(input.target_revenue_roas));
    const availableSlots = Math.max(0, Math.floor(n(input.available_slots)));
    const days = Math.max(1, Math.floor(n(input.campaign_days) || 1));
    const cashCap = Math.max(0, n(input.cash_budget_cap));
    const historicalCost = Math.max(0, n(input.historical_cost_per_event));
    const contributionMargin = Math.max(0, price - variableCost);
    const maxCacByProfit = Math.max(0, contributionMargin - desiredProfit);
    const maxCacByRoas = targetRoas > 0 ? price / targetRoas : 0;
    const allowableCac = maxCacByProfit > 0 && maxCacByRoas > 0
      ? Math.min(maxCacByProfit, maxCacByRoas)
      : Math.max(maxCacByProfit, maxCacByRoas);
    const pCompleted = clamp01(input.qualified_to_booking_rate)
      * clamp01(input.booking_to_completed_rate)
      * (1 - clamp01(input.refund_or_no_show_rate));
    const targetCpql = allowableCac * pCompleted;
    const capacityCap = availableSlots * allowableCac;
    const positiveCaps = [cashCap, capacityCap].filter((x) => x > 0);
    const hardCap = positiveCaps.length ? Math.min(...positiveCaps) : 0;
    const stableWeekly = historicalCost * 50;
    const proposed = hardCap > 0 ? hardCap : cashCap;
    const expectedEvents = historicalCost > 0 ? proposed / historicalCost : null;
    const sufficient = price > 0 && variableCost >= 0 && availableSlots > 0 && cashCap > 0;
    const warnings = [];
    if (!sufficient) warnings.push("Faltan precio, capacidad o tope de caja para recomendar inversión.");
    if (!historicalCost) warnings.push("Sin costo histórico: el resultado esperado es una hipótesis, no una promesa.");
    if (historicalCost && proposed < stableWeekly) warnings.push("Piloto con aprendizaje limitado: no alcanza 50 eventos estimados por semana.");
    if (capacityCap && cashCap > capacityCap) warnings.push("El presupuesto de caja supera la demanda que la capacidad declarada puede atender.");
    return {
      sufficient,
      contribution_margin: round2(contributionMargin),
      allowable_cac: round2(allowableCac),
      target_cost_per_qualified_lead: round2(targetCpql),
      capacity_budget_cap: round2(capacityCap),
      cash_budget_cap: round2(cashCap),
      recommended_total_cap: round2(proposed),
      recommended_daily_cap: round2(proposed / days),
      stable_weekly_budget: round2(stableWeekly),
      expected_events: expectedEvents === null ? null : round2(expectedEvents),
      sample_quality: historicalCost ? (expectedEvents >= 50 ? "usable" : "directional") : "insufficient",
      scenarios: [
        { id: "pilot", label: "Piloto diagnóstico", total: round2(Math.min(proposed || cashCap, historicalCost ? historicalCost * 10 : cashCap)) },
        { id: "learning", label: "Aprendizaje viable", total: round2(stableWeekly), feasible: stableWeekly > 0 && stableWeekly <= proposed },
        { id: "capacity", label: "Capacidad completa", total: round2(capacityCap) },
      ],
      warnings,
    };
  }

  function lintPolicy(input = {}) {
    const copy = String(input.copy || "").trim();
    const issues = [];
    const add = (code, severity, message) => issues.push({ code, severity, message });
    if (/¿[^?]*(embarazad|deuda|edad|salud|migratori)/i.test(copy)) add("personal_attribute", "block", "El copy parece afirmar un atributo personal del espectador.");
    if (/garantizad[oa]|100\s*%\s*(seguro|garantizado)/i.test(copy)) add("guarantee", "block", "No se permiten resultados garantizados sin base verificable.");
    if (/(últim[oa]s?\s+cupos?|solo\s+\d+\s+cupos?)/i.test(copy) && !input.availability_verified) add("unverified_scarcity", "block", "La escasez requiere cupos y fecha verificados.");
    if (/más\s+de\s+\d+\s+(clientes|familias|sesiones)/i.test(copy) && !input.proof_verified) add("unverified_social_proof", "block", "La prueba social numérica requiere evidencia.");
    if (input.contains_minor && !input.guardian_release) add("minor_release", "block", "El creativo con menores requiere autorización comercial del tutor.");
    if (input.people_visible && !input.model_release) add("model_release", "block", "Las personas visibles requieren autorización comercial aplicable.");
    if (input.destination_https === false) add("destination_https", "block", "El destino debe usar HTTPS y responder correctamente.");
    if (n(input.offer_price) > 0 && n(input.destination_price) > 0 && n(input.offer_price) !== n(input.destination_price)) add("price_mismatch", "block", "El precio del anuncio no coincide con el destino.");
    if (!copy) add("empty_copy", "warning", "Falta copy para ejecutar el linter completo.");
    return { issues, blocked: issues.some((x) => x.severity === "block") };
  }

  function validatePlacements(selected = [], availableAssetFamilies = []) {
    const assets = new Set(availableAssetFamilies);
    const rows = creativeSpecs.flatMap((spec) => spec.placements
      .filter((placement) => selected.includes(placement))
      .map((placement) => ({ placement, family: spec.id, compatible: assets.has(spec.id), spec })));
    const missing = rows.filter((row) => !row.compatible);
    return { rows, missing, valid: rows.length > 0 && missing.length === 0 };
  }

  function consentState(client = {}) {
    const optedOut = client.marketing_opt_out === true || client.opt_out === true
      || client.consent_status === "revoked";
    if (optedOut) return "excluded";
    const explicit = client.marketing_consent === true || client.consent_marketing === true
      || client.consent_status === "granted";
    const expires = client.marketing_consent_expires_at || client.consent_expires_at;
    if (explicit && expires && new Date(expires).getTime() < Date.now()) return "expired";
    return explicit ? "consented" : "unknown";
  }

  function summarizeAudience(rows = []) {
    const result = { total: rows.length, consented: 0, excluded: 0, expired: 0, unknown: 0, contactable: 0 };
    for (const row of rows) {
      const state = consentState(row);
      result[state] += 1;
      if (state === "consented" && String(row.telefono || row.phone || row.email || "").trim())
        result.contactable += 1;
    }
    result.exportable = result.contactable;
    return result;
  }

  function validateCreativeAsset(input = {}) {
    const issues = [];
    const family = String(input.family || "");
    if (!creativeSpecs.some((x) => x.id === family))
      issues.push({ code: "family", severity: "block", message: "Selecciona una familia creativa vigente." });
    if (!String(input.name || "").trim())
      issues.push({ code: "name", severity: "block", message: "Identifica el activo sin exponer datos personales." });
    if (input.people_visible && !input.model_release)
      issues.push({ code: "model_release", severity: "block", message: "Falta autorización comercial de las personas visibles." });
    if (input.contains_minor && !input.guardian_release)
      issues.push({ code: "guardian_release", severity: "block", message: "Falta autorización comercial del tutor." });
    if (input.rights_expires_at && new Date(input.rights_expires_at).getTime() < Date.now())
      issues.push({ code: "rights_expired", severity: "block", message: "Los derechos registrados están vencidos." });
    if (!input.rights_scope)
      issues.push({ code: "rights_scope", severity: "warning", message: "Documenta el alcance de uso del activo." });
    return { issues, blocked: issues.some((x) => x.severity === "block") };
  }

  function capacitySummary(entries = [], from = "", to = "") {
    const start = from ? new Date(`${from}T00:00:00`) : null;
    const end = to ? new Date(`${to}T23:59:59`) : null;
    const selected = entries.filter((x) => {
      const date = new Date(`${x.date}T12:00:00`);
      return (!start || date >= start) && (!end || date <= end);
    });
    return selected.reduce((acc, row) => {
      const slots = Math.max(0, Math.floor(n(row.slots)));
      const reserved = Math.max(0, Math.min(slots, Math.floor(n(row.reserved))));
      acc.slots += slots;
      acc.reserved += reserved;
      acc.available += slots - reserved;
      return acc;
    }, { days: selected.length, slots: 0, reserved: 0, available: 0 });
  }

  function evaluateExperiment(input = {}) {
    const minEvents = Math.max(1, Math.floor(n(input.minimum_events) || 20));
    const controlEvents = Math.max(0, Math.floor(n(input.control_events)));
    const challengerEvents = Math.max(0, Math.floor(n(input.challenger_events)));
    const controlSpend = Math.max(0, n(input.control_spend));
    const challengerSpend = Math.max(0, n(input.challenger_spend));
    const controlCost = controlEvents ? controlSpend / controlEvents : null;
    const challengerCost = challengerEvents ? challengerSpend / challengerEvents : null;
    if (controlEvents < minEvents || challengerEvents < minEvents)
      return { decision: "insufficient_data", confidence: "low", control_cost: controlCost, challenger_cost: challengerCost, reason: `Cada variante necesita al menos ${minEvents} eventos comparables.` };
    if (controlCost === null || challengerCost === null)
      return { decision: "insufficient_data", confidence: "low", control_cost: controlCost, challenger_cost: challengerCost, reason: "Falta gasto o resultado comparable." };
    const delta = (challengerCost - controlCost) / Math.max(controlCost, 0.01);
    if (Math.abs(delta) < 0.1)
      return { decision: "keep_test", confidence: "medium", control_cost: round2(controlCost), challenger_cost: round2(challengerCost), reason: "La diferencia de costo es menor al 10%." };
    return { decision: delta < 0 ? "challenger" : "control", confidence: "directional", control_cost: round2(controlCost), challenger_cost: round2(challengerCost), reason: "Decisión direccional; validar calidad y sesiones completadas antes de escalar." };
  }

  function funnelMetrics(events = []) {
    const stages = ["lead", "qualified", "booking", "completed", "paid"];
    const counts = Object.fromEntries(stages.map((stage) => [stage, 0]));
    let revenue = 0;
    for (const event of events) {
      if (stages.includes(event.stage)) counts[event.stage] += 1;
      if (event.stage === "paid") revenue += Math.max(0, n(event.value));
    }
    return { ...counts, revenue: round2(revenue) };
  }

  const campaignTransitions = Object.freeze({
    draft_review_required: ["qa_ready"],
    saved: ["qa_ready"],
    qa_ready: ["approved"],
    approved: ["publish_paused_requested"],
    publish_paused_requested: ["paused"],
    paused: ["active", "archived"],
    active: ["paused"],
    archived: [],
  });

  function canTransitionCampaign(from, to, options = {}) {
    const allowed = (campaignTransitions[from] || []).includes(to);
    if (!allowed) return { ok: false, reason: "Transición de estado no permitida." };
    if (["publish_paused_requested", "paused", "active"].includes(to) && !options.meta_backend_connected)
      return { ok: false, reason: "Meta backend no conectado; no se puede crear ni activar objetos remotos." };
    if (["approved", "publish_paused_requested", "active"].includes(to) && !options.human_approval)
      return { ok: false, reason: "Esta transición exige aprobación humana registrada." };
    return { ok: true, reason: "Transición permitida." };
  }

  return {
    templates, creativeSpecs, recommendTemplates, calculateBudget, lintPolicy, validatePlacements,
    consentState, summarizeAudience, validateCreativeAsset, capacitySummary, evaluateExperiment,
    funnelMetrics, campaignTransitions, canTransitionCampaign,
  };
});
