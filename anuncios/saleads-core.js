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

  function coverCrop(sourceWidth, sourceHeight, targetWidth, targetHeight, focusX = 0.5, focusY = 0.5) {
    const sw = Math.max(1, n(sourceWidth));
    const sh = Math.max(1, n(sourceHeight));
    const tw = Math.max(1, n(targetWidth));
    const th = Math.max(1, n(targetHeight));
    const scale = Math.max(tw / sw, th / sh);
    const width = Math.min(sw, tw / scale);
    const height = Math.min(sh, th / scale);
    const x = Math.max(0, Math.min(sw - width, clamp01(focusX) * sw - width / 2));
    const y = Math.max(0, Math.min(sh - height, clamp01(focusY) * sh - height / 2));
    return { x: round2(x), y: round2(y), width: round2(width), height: round2(height), scale: round2(scale) };
  }

  function planCreativeVariants(input = {}) {
    const sourceWidth = Math.max(0, n(input.source_width));
    const sourceHeight = Math.max(0, n(input.source_height));
    const sizeBytes = Math.max(0, n(input.size_bytes));
    const mime = String(input.mime || "").toLowerCase();
    const issues = [];
    if (!sourceWidth || !sourceHeight)
      issues.push({ code: "image_dimensions", severity: "block", message: "No se pudieron leer las dimensiones de la fotografía." });
    if (!["image/jpeg", "image/png", "image/webp"].includes(mime))
      issues.push({ code: "image_mime", severity: "block", message: "Usa una fotografía JPG, PNG o WebP." });
    if (sizeBytes > 30 * 1024 * 1024)
      issues.push({ code: "image_size", severity: "block", message: "La fotografía supera el límite local de 30 MB." });

    const baseName = slugKey(String(input.name || "creativo-dcarela")).slice(0, 48);
    const variants = sourceWidth && sourceHeight
      ? creativeSpecs.map((spec) => {
          const safe = spec.safe_zone || { top_pct: 6, bottom_pct: 16, left_pct: 6, right_pct: 6 };
          if (sourceWidth < spec.width || sourceHeight < spec.height)
            issues.push({ code: `upscale_${spec.id}`, severity: "warning", message: `${spec.label}: la fuente es menor que ${spec.width}×${spec.height}; revisa nitidez al 100%.` });
          return {
            id: spec.id,
            label: spec.label,
            ratio: spec.ratio,
            width: spec.width,
            height: spec.height,
            placements: [...spec.placements],
            crop: coverCrop(sourceWidth, sourceHeight, spec.width, spec.height, input.focus_x, input.focus_y),
            safe_zone: { ...safe },
            file_name: `${baseName}-${spec.id}-${spec.width}x${spec.height}.jpg`,
          };
        })
      : [];
    return { variants, issues, blocked: issues.some((issue) => issue.severity === "block") };
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

  // --- Cerebro estratégico local v1 -----------------------------------
  // Trabaja exclusivamente con agregados declarados/verificados. No recibe
  // clientes, teléfonos, correos, conversaciones ni fotografías. Su salida
  // comparte el mismo contrato estricto que deberá usar un backend generativo.
  const aiActions = Object.freeze([
    "keep", "pause_proposal", "new_creative", "budget_change_proposal", "insufficient_data",
  ]);

  function aiSampleQuality(input = {}) {
    const completed = Math.max(0, Math.floor(n(input.completed_sessions)));
    const qualified = Math.max(0, Math.floor(n(input.qualified_leads)));
    const windowDays = Math.max(1, Math.floor(n(input.window_days) || 1));
    if (completed >= 10 && qualified >= 20 && windowDays >= 7) return "usable";
    if (completed >= 3 && qualified >= 8) return "directional";
    return "insufficient";
  }

  function buildAiContext(input = {}) {
    const service = slugKey(input.service || "general");
    const price = Math.max(0, n(input.price));
    const variableCost = Math.max(0, n(input.variable_cost));
    const targetRoas = Math.max(0, n(input.target_revenue_roas));
    const margin = Math.max(0, price - variableCost);
    const spend = Math.max(0, n(input.spend));
    const qualified = Math.max(0, Math.floor(n(input.qualified_leads)));
    const bookings = Math.max(0, Math.floor(n(input.bookings)));
    const completed = Math.max(0, Math.floor(n(input.completed_sessions)));
    const windowDays = Math.max(1, Math.floor(n(input.window_days) || 7));
    return {
      schema_version: 1,
      privacy: "aggregates_only_no_pii",
      business_context: { service, branch: "redacted-id" },
      economics: { price: round2(price), variable_cost: round2(variableCost), contribution_margin: round2(margin), target_revenue_roas: round2(targetRoas) },
      capacity: { available_slots: Math.max(0, Math.floor(n(input.available_slots))), period: "campaign_window" },
      campaign: { status: slugKey(input.campaign_status || "draft"), window_days: windowDays, budget_total: round2(Math.max(0, n(input.budget_total))) },
      metrics: {
        spend: round2(spend),
        qualified_leads: qualified,
        bookings,
        completed_sessions: completed,
        frequency: round2(Math.max(0, n(input.frequency))),
        creative_age_days: Math.max(0, Math.floor(n(input.creative_age_days))),
      },
      sample_quality: { status: aiSampleQuality(input), notes: [] },
      constraints: ["no_activate", "no_publish", "no_budget_write", "human_approval_required"],
      allowed_actions: ["recommend", "draft"],
      forbidden_actions: ["activate", "publish", "increase_budget", "send_customer_data"],
    };
  }

  function validateAiRecommendation(output = {}) {
    const errors = [];
    if (!output || typeof output !== "object" || Array.isArray(output))
      return { valid: false, errors: ["La recomendación debe ser un objeto."] };
    if (!aiActions.includes(output.action)) errors.push("Acción no permitida.");
    if (!String(output.recommendation_id || "").trim()) errors.push("Falta recommendation_id.");
    if (!String(output.summary || "").trim() || String(output.summary).length > 320) errors.push("Resumen ausente o demasiado largo.");
    if (!Array.isArray(output.rationale) || !output.rationale.length || output.rationale.some((x) => !String(x).trim())) errors.push("La justificación debe contener evidencia explicada.");
    if (!Array.isArray(output.evidence) || !output.evidence.length) errors.push("La recomendación no contiene evidencia.");
    else if (output.evidence.some((x) => !String(x?.metric || "").trim() || !Number.isFinite(Number(x?.value)) || !String(x?.window || "").trim() || !String(x?.source || "").trim())) errors.push("La evidencia no cumple el contrato.");
    if (!Number.isFinite(Number(output.confidence)) || Number(output.confidence) < 0 || Number(output.confidence) > 1) errors.push("La confianza debe estar entre 0 y 1.");
    if (output.requires_human_approval !== true) errors.push("Toda recomendación exige aprobación humana.");
    if (Number(output.schema_version) !== 1) errors.push("schema_version no compatible.");
    if (!Number.isFinite(Date.parse(String(output.expires_at || "")))) errors.push("Caducidad inválida.");
    if (!Array.isArray(output.risks)) errors.push("Falta la lista de riesgos.");
    const effect = output.expected_effect;
    if (!effect || typeof effect !== "object") errors.push("Falta expected_effect.");
    else {
      const values = [effect.low, effect.mid, effect.high].filter((x) => x !== null && x !== undefined);
      if (values.some((x) => !Number.isFinite(Number(x)))) errors.push("El efecto esperado contiene valores inválidos.");
      if (values.length === 3 && !(Number(effect.low) <= Number(effect.mid) && Number(effect.mid) <= Number(effect.high))) errors.push("El intervalo esperado está desordenado.");
    }
    return { valid: errors.length === 0, errors };
  }

  function planStrategicRecommendation(input = {}) {
    const context = buildAiContext(input);
    const now = Number.isFinite(Date.parse(String(input.now || ""))) ? new Date(input.now) : new Date();
    const expires = new Date(now.getTime() + 7 * 86400000).toISOString();
    const completed = context.metrics.completed_sessions;
    const spend = context.metrics.spend;
    const available = context.capacity.available_slots;
    const quality = context.sample_quality.status;
    const budget = calculateBudget({
      price: context.economics.price,
      variable_cost: context.economics.variable_cost,
      desired_profit_after_ads: input.desired_profit_after_ads,
      target_revenue_roas: context.economics.target_revenue_roas,
      available_slots: available,
      campaign_days: context.campaign.window_days,
      cash_budget_cap: context.campaign.budget_total,
      historical_cost_per_event: completed > 0 ? spend / completed : 0,
    });
    const costPerCompleted = completed > 0 ? round2(spend / completed) : null;
    const evidence = [
      { metric: "completed_sessions", value: completed, window: `${context.campaign.window_days} días`, source: "saleads_attribution" },
      { metric: "available_slots", value: available, window: "ventana de campaña", source: "saleads_capacity" },
    ];
    if (spend > 0) evidence.push({ metric: "spend_dop", value: spend, window: `${context.campaign.window_days} días`, source: "operator_verified_input" });
    if (budget.allowable_cac > 0) evidence.push({ metric: "allowable_cac_dop", value: budget.allowable_cac, window: "economía vigente", source: "campaign_economics" });
    if (costPerCompleted !== null) evidence.push({ metric: "cost_per_completed_session_dop", value: costPerCompleted, window: `${context.campaign.window_days} días`, source: "derived_from_verified_aggregates" });

    let action = "keep";
    let summary = "Mantener el plan y seguir midiendo sesiones completadas.";
    const rationale = [];
    const risks = [];
    if (input.evidence_verified !== true || spend <= 0 || completed <= 0) {
      action = "insufficient_data";
      summary = "No hay evidencia suficiente para recomendar un cambio operativo.";
      rationale.push("Se necesita gasto verificado y al menos una sesión completada atribuida.");
      risks.push("Tomar una decisión ahora confundiría ausencia de datos con bajo rendimiento.");
    } else if (available <= 0) {
      action = "pause_proposal";
      summary = "Proponer pausa: no quedan espacios vendibles en la ventana analizada.";
      rationale.push("La capacidad disponible es cero y seguir comprando demanda puede degradar la atención.");
      risks.push("La pausa requiere revisión humana y verificación del calendario.");
    } else if (budget.allowable_cac > 0 && costPerCompleted > budget.allowable_cac * 1.15) {
      action = "pause_proposal";
      summary = "Proponer pausa y revisión de oferta: el costo observado supera el CAC tolerable.";
      rationale.push(`Costo por sesión ${round2(costPerCompleted)} frente a CAC tolerable ${budget.allowable_cac}.`);
      risks.push("La muestra puede ser inestable; revisar atribución antes de pausar.");
    } else if (context.metrics.frequency >= 3.5 || context.metrics.creative_age_days >= 21) {
      action = "new_creative";
      summary = "Preparar una variante creativa nueva sin cambiar presupuesto ni audiencia.";
      rationale.push(context.metrics.frequency >= 3.5 ? "La frecuencia declarada indica posible fatiga." : "El creativo supera 21 días en circulación.");
      risks.push("Cambiar una sola variable para conservar un experimento interpretable.");
    } else if (quality === "usable" && budget.allowable_cac > 0 && costPerCompleted <= budget.allowable_cac * 0.75 && available >= 2) {
      action = "budget_change_proposal";
      summary = "Existe señal para evaluar un aumento limitado, nunca automático.";
      rationale.push("El costo por sesión está por debajo del 75% del CAC tolerable y existe capacidad.");
      risks.push("Una variación de presupuesto puede reiniciar aprendizaje y no garantiza el mismo costo.");
    } else {
      rationale.push("El costo observado no cruza los umbrales conservadores de pausa o aumento.");
      if (quality !== "usable") risks.push("La muestra todavía es direccional; no declarar ganador.");
    }
    if (quality === "insufficient" && !risks.includes("La muestra todavía es direccional; no declarar ganador.")) risks.push("La muestra es insuficiente para estimar impacto con precisión.");

    let expectedEffect = { low: null, mid: null, high: null, unit: "completed_sessions" };
    if (action === "budget_change_proposal" && costPerCompleted > 0) {
      const currentBudget = Math.max(spend, context.campaign.budget_total);
      const proposedBudget = Math.min(currentBudget * 1.15, available * budget.allowable_cac);
      const incremental = Math.max(0, proposedBudget - currentBudget) / costPerCompleted;
      expectedEffect = { low: round2(incremental * 0.5), mid: round2(incremental), high: round2(incremental * 1.25), unit: "completed_sessions_directional" };
    }
    const recommendation = {
      recommendation_id: `rec_${now.toISOString().replace(/[^0-9]/g, "").slice(0, 14)}_${slugKey(input.service || "general")}`,
      action,
      summary,
      rationale,
      evidence,
      confidence: quality === "usable" ? 0.78 : quality === "directional" ? 0.48 : 0.18,
      expected_effect: expectedEffect,
      risks,
      requires_human_approval: true,
      expires_at: expires,
      schema_version: 1,
    };
    return { recommendation, context, validation: validateAiRecommendation(recommendation) };
  }

  function planExperiment(input = {}) {
    const minimumEvents = Math.max(5, Math.floor(n(input.minimum_events) || 20));
    const eventCost = Math.max(0, n(input.expected_cost_per_event));
    const dailyBudget = Math.max(0, n(input.daily_budget));
    const days = Math.max(1, Math.floor(n(input.days) || 7));
    const requiredBudget = round2(minimumEvents * eventCost * 2);
    const availableBudget = round2(dailyBudget * days);
    const variable = ["creative", "copy", "destination", "audience"].includes(input.variable) ? input.variable : "creative";
    const feasible = eventCost > 0 && availableBudget >= requiredBudget;
    return {
      schema_version: 1,
      variable,
      arms: 2,
      minimum_events_per_arm: minimumEvents,
      expected_cost_per_event: round2(eventCost),
      required_budget: requiredBudget,
      available_budget: availableBudget,
      feasible,
      status: eventCost <= 0 ? "insufficient_data" : feasible ? "ready_to_draft" : "budget_or_scope_insufficient",
      guidance: eventCost <= 0
        ? "Registra un costo histórico verificable antes de estimar la prueba."
        : feasible
          ? "Mantén oferta, público y destino constantes; cambia solo la variable indicada."
          : "Reduce el alcance o reúne más presupuesto; no dividas una muestra que quedará sin señal.",
    };
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

  // --- Sincronización operativa v4 (Firestore + copia local) -----------
  // Cada colección es append-only salvo la capacidad, que usa identificador
  // determinista por fecha+servicio para que reescribir una jornada no cree
  // duplicados. Ninguna función borra datos.
  const operationCollections = Object.freeze({
    creative_assets: Object.freeze({ collection: "saleads_assets", mode: "append_only", limit: 500 }),
    capacity_entries: Object.freeze({ collection: "saleads_capacity", mode: "upsert", limit: 500 }),
    experiments: Object.freeze({ collection: "saleads_experiments", mode: "append_only", limit: 500 }),
    attribution_events: Object.freeze({ collection: "saleads_attribution", mode: "append_only", limit: 500 }),
    audit_entries: Object.freeze({ collection: "saleads_audit", mode: "append_only", limit: 500 }),
  });

  function operationSpec(kind) {
    const spec = operationCollections[kind];
    if (!spec) throw new Error(`Colección operativa desconocida: ${kind}`);
    return spec;
  }

  function slugKey(value) {
    const text = String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return text.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "sin-dato";
  }

  function operationDocId(kind, businessId, row = {}) {
    operationSpec(kind);
    const business = slugKey(businessId);
    if (kind === "capacity_entries") return `${business}__${slugKey(row.date)}__${slugKey(row.service)}`;
    return `${business}__${slugKey(row.id)}`;
  }

  function rowStamp(row = {}) {
    return String(row.updated_at || row.created_at || "");
  }

  function mergeOperationRows(kind, localRows = [], cloudRows = [], businessId = "") {
    const spec = operationSpec(kind);
    const merged = new Map();
    for (const row of localRows) {
      const key = operationDocId(kind, businessId, row);
      if (!merged.has(key)) merged.set(key, { ...row, sync_state: row.sync_state === "synced" ? "synced" : "pending" });
    }
    for (const row of cloudRows) {
      const key = operationDocId(kind, businessId, row);
      const local = merged.get(key);
      const localIsNewer =
        local && spec.mode === "upsert" && local.sync_state !== "synced" && rowStamp(local) > rowStamp(row);
      if (!localIsNewer) merged.set(key, { ...row, sync_state: "synced" });
    }
    return [...merged.values()]
      .sort((a, b) => rowStamp(b).localeCompare(rowStamp(a)))
      .slice(0, spec.limit);
  }

  function planOperationMigration(kind, localRows = [], cloudRows = [], businessId = "") {
    const spec = operationSpec(kind);
    const remote = new Map(cloudRows.map((row) => [operationDocId(kind, businessId, row), row]));
    const upload = [];
    let alreadySynced = 0;
    for (const row of localRows) {
      const key = operationDocId(kind, businessId, row);
      const cloudRow = remote.get(key);
      if (!cloudRow) { upload.push(row); continue; }
      if (spec.mode === "upsert" && rowStamp(row) > rowStamp(cloudRow)) upload.push(row);
      else alreadySynced += 1;
    }
    return { kind, collection: spec.collection, mode: spec.mode, upload, already_synced: alreadySynced };
  }

  const syncStates = Object.freeze({
    idle: Object.freeze({ label: "Sin sincronizar", tone: "muted" }),
    loading: Object.freeze({ label: "Sincronizando", tone: "muted" }),
    cloud: Object.freeze({ label: "Sincronizado", tone: "success" }),
    local_only: Object.freeze({ label: "Solo en este dispositivo", tone: "warning" }),
    permission: Object.freeze({ label: "Permiso insuficiente", tone: "warning" }),
    quota: Object.freeze({ label: "Cuota agotada", tone: "danger" }),
    offline: Object.freeze({ label: "Sin conexión", tone: "warning" }),
    expired: Object.freeze({ label: "Sesión vencida", tone: "danger" }),
    unknown: Object.freeze({ label: "Error de sincronización", tone: "danger" }),
  });

  function syncStateLabel(state) {
    return syncStates[state] || syncStates.unknown;
  }

  function describeSyncError(error, options = {}) {
    const code = String(error?.code || error?.name || "").toLowerCase();
    const text = String(error?.message || error || "").toLowerCase();
    const online = options.online === undefined ? true : Boolean(options.online);
    if (code.includes("unauthenticated") || text.includes("unauthenticated") || (text.includes("token") && text.includes("expir")))
      return { state: "expired", message: "La sesión venció. Vuelve a iniciar sesión para sincronizar; nada se borró." };
    if (code.includes("permission-denied") || text.includes("insufficient permissions"))
      return { state: "permission", message: "Tu rol no puede leer o escribir estos datos en la nube. La copia de este dispositivo sigue intacta." };
    if (code.includes("resource-exhausted") || text.includes("quota"))
      return { state: "quota", message: "Firestore agotó la cuota del proyecto. No se sincroniza hasta restablecerla; los datos locales se conservan." };
    if (!online || code.includes("unavailable") || text.includes("offline") || text.includes("network") || text.includes("failed to fetch"))
      return { state: "offline", message: "Sin conexión con Firestore. Se muestra la copia local de esta sucursal y los cambios quedan pendientes." };
    return { state: "unknown", message: "No se pudo sincronizar. Se conserva la copia local sin borrar nada." };
  }

  function summarizeSync(state, options = {}) {
    const info = syncStateLabel(state);
    const pending = Math.max(0, Math.floor(n(options.pending)));
    const rows = Math.max(0, Math.floor(n(options.rows)));
    const parts = [info.label];
    if (rows) parts.push(`${rows} registro(s)`);
    if (pending) parts.push(`${pending} pendiente(s) de subir`);
    return { state, tone: info.tone, label: info.label, pending, rows, text: parts.join(" · ") };
  }

  function auditEntry(input = {}) {
    const created = input.created_at || new Date().toISOString();
    const action = String(input.action || "unknown");
    return {
      id: input.id || `audit_${Date.parse(created) || Date.now()}_${slugKey(action).slice(0, 20)}`,
      action,
      entity: String(input.entity || ""),
      entity_id: String(input.entity_id || ""),
      detail: String(input.detail || "").slice(0, 300),
      actor_uid: String(input.actor_uid || ""),
      actor_email: String(input.actor_email || ""),
      created_at: created,
      source: "saleads_panel",
    };
  }

  return {
    templates, creativeSpecs, recommendTemplates, calculateBudget, lintPolicy, validatePlacements,
    coverCrop, planCreativeVariants,
    consentState, summarizeAudience, validateCreativeAsset, capacitySummary, evaluateExperiment,
    funnelMetrics, campaignTransitions, canTransitionCampaign,
    aiActions, aiSampleQuality, buildAiContext, validateAiRecommendation,
    planStrategicRecommendation, planExperiment,
    operationCollections, operationDocId, mergeOperationRows, planOperationMigration,
    syncStates, syncStateLabel, describeSyncError, summarizeSync, auditEntry, slugKey,
  };
});
