import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const BUILD = "2026-08-24-saleads-creative-studio-v6";
const saleAds = window.SaleAdsCore;
if (!saleAds) throw new Error("No se cargó el motor seguro de SaleAds.");
const SALEADS_UI = new URLSearchParams(location.search).get("saleads_ui") === "classic" ? "classic" : "phase1";
const firebaseConfig = window.__DCARELA_FIREBASE_CONFIG || {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = (id) => document.getElementById(id);
const clean = (value) => String(value ?? "").trim();
const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (value) =>
  new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
const normalizePhone = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .replace(/^1(?=\d{10}$)/, "1");
const LOCAL_KEY = "dcarela_ads_standalone_v1";
let member = null,
  businesses = [],
  clients = [],
  products = [],
  campaigns = [],
  creativeAssets = [],
  capacityEntries = [],
  experimentRecords = [],
  attributionEvents = [],
  auditEntries = [],
  current = null,
  wizardStep = 0,
  wizardTemplateId = "T01";
const WIZARD_KEY = "dcarela_saleads_wizard_v3";
const OPERATIONS_KEY = "dcarela_saleads_operations_v1";
let studioSource = { file: null, image: null, objectUrl: "", plan: null };

function operationStore() {
  try { return JSON.parse(localStorage.getItem(OPERATIONS_KEY) || "{}"); }
  catch { return {}; }
}
function cachedRows(name) {
  return operationStore()?.[selectedBusiness()]?.[name] || [];
}
function cacheRows(name, rows) {
  const all = operationStore();
  const bid = selectedBusiness();
  all[bid] = { ...(all[bid] || {}), [name]: rows.slice(0, 500) };
  localStorage.setItem(OPERATIONS_KEY, JSON.stringify(all));
}

// Los modulos operativos v4 viven en colecciones compartidas de Firestore con
// copia local de respaldo. La copia local nunca se borra: si la nube falla el
// panel sigue operando y los registros quedan marcados como pendientes.
const OPERATION_KINDS = Object.keys(saleAds.operationCollections);
const randomSuffix = () => Math.random().toString(36).slice(2, 8);
let operationSync = { state: "idle", message: "", pending: 0, rows: 0 };

function operationLists() {
  return {
    creative_assets: creativeAssets,
    capacity_entries: capacityEntries,
    experiments: experimentRecords,
    attribution_events: attributionEvents,
    audit_entries: auditEntries,
  };
}
function assignOperationRows(kind, rows) {
  if (kind === "creative_assets") creativeAssets = rows;
  else if (kind === "capacity_entries") capacityEntries = rows;
  else if (kind === "experiments") experimentRecords = rows;
  else if (kind === "attribution_events") attributionEvents = rows;
  else if (kind === "audit_entries") auditEntries = rows;
}
function canWriteCloud() {
  return ["owner", "admin"].includes(roleForBusiness());
}
function pendingCount() {
  return Object.values(operationLists()).reduce(
    (total, rows) => total + rows.filter((x) => x.sync_state !== "synced").length,
    0,
  );
}
function operationRowCount() {
  return Object.values(operationLists()).reduce((total, rows) => total + rows.length, 0);
}
function setSyncState(state, message) {
  operationSync = { state, message: message || "", pending: pendingCount(), rows: operationRowCount() };
  renderSyncBanner();
}
function renderSyncBanner() {
  const summary = saleAds.summarizeSync(operationSync.state, { pending: operationSync.pending, rows: operationSync.rows });
  const tone = { success: "success-text", warning: "warning-text", danger: "danger-text" }[summary.tone] || "muted-text";
  const html = `<span class="status-chip ${tone}">${escapeHtml(summary.text)}</span><small>${escapeHtml(operationSync.message)}</small><button type="button" class="ghost" data-sync-retry>Reintentar</button>`;
  document.querySelectorAll("[data-sync-banner]").forEach((node) => { node.innerHTML = html; });
}
async function fetchOperationCloud(businessId) {
  const cloud = {};
  for (const kind of OPERATION_KINDS) {
    const spec = saleAds.operationCollections[kind];
    const snap = await getDocs(query(collection(db, spec.collection), where("business_id", "==", businessId)));
    const rows = [];
    snap.forEach((entry) => {
      const data = entry.data() || {};
      rows.push({ ...data, id: data.id || entry.id });
    });
    cloud[kind] = rows;
  }
  return cloud;
}
async function pushOperationRow(kind, row, businessId = selectedBusiness()) {
  if (!auth.currentUser)
    return { synced: false, state: "expired", message: "La sesion vencio; el registro quedo pendiente en este dispositivo." };
  if (!canWriteCloud())
    return { synced: false, state: "permission", message: "Tu rol guarda solo en este dispositivo; owner/admin comparte con la sucursal." };
  const spec = saleAds.operationCollections[kind];
  const payload = {
    ...row,
    business_id: businessId,
    collection_mode: spec.mode,
    created_by_uid: auth.currentUser.uid,
    created_by_email: auth.currentUser.email || "",
    synced_at: new Date().toISOString(),
  };
  delete payload.sync_state;
  try {
    await setDoc(doc(db, spec.collection, saleAds.operationDocId(kind, businessId, row)), payload);
    return { synced: true, state: "cloud", message: "" };
  } catch (error) {
    console.warn("operations-push", kind, error);
    return { synced: false, ...saleAds.describeSyncError(error, { online: navigator.onLine }) };
  }
}
async function persistOperation(kind, rows, row) {
  row.sync_state = "pending";
  cacheRows(kind, rows);
  const outcome = await pushOperationRow(kind, row);
  row.sync_state = outcome.synced ? "synced" : "pending";
  cacheRows(kind, rows);
  if (outcome.synced) setSyncState(pendingCount() ? "local_only" : "cloud", "");
  else setSyncState(outcome.state, outcome.message);
  return outcome;
}
async function recordAudit(input) {
  const entry = {
    ...saleAds.auditEntry({
      ...input,
      actor_uid: auth.currentUser?.uid || "",
      actor_email: auth.currentUser?.email || "",
    }),
    business_id: selectedBusiness(),
  };
  auditEntries.unshift(entry);
  await persistOperation("audit_entries", auditEntries, entry);
  renderAuditTrail();
  return entry;
}
async function syncPendingOperations(businessId, cloud) {
  if (!canWriteCloud()) {
    if (pendingCount())
      setSyncState("permission", "Hay registros locales sin compartir: tu rol no puede escribir en la nube.");
    else setSyncState("cloud", "Datos operativos leidos desde la sucursal.");
    return;
  }
  let failure = null;
  let uploaded = 0;
  for (const kind of OPERATION_KINDS) {
    const rows = operationLists()[kind];
    const plan = saleAds.planOperationMigration(kind, rows, cloud[kind] || [], businessId);
    for (const row of rows) if (!plan.upload.includes(row)) row.sync_state = "synced";
    for (const row of plan.upload) {
      const outcome = await pushOperationRow(kind, row, businessId);
      if (outcome.synced) {
        row.sync_state = "synced";
        uploaded += 1;
      } else {
        row.sync_state = "pending";
        failure = failure || outcome;
      }
    }
    cacheRows(kind, rows);
  }
  if (failure) setSyncState(failure.state, failure.message);
  else
    setSyncState(
      "cloud",
      uploaded
        ? `Se compartieron ${uploaded} registro(s) de este dispositivo con la sucursal.`
        : "Datos operativos sincronizados con la sucursal.",
    );
}
function roleForBusiness() {
  return clean(member?.roles?.[selectedBusiness()] || member?.role || "viewer").toLowerCase();
}

const PRESETS = {
  xv: {
    label: "XV años",
    hook: "Haz que sus XV se sientan tan únicos como ella",
    audience: "Madres y jóvenes de 14 a 17 años en La Romana",
  },
  infantil: {
    label: "Infantil",
    hook: "Su infancia cambia rápido; este momento merece quedarse",
    audience: "Familias con niños de 1 a 10 años",
  },
  graduacion: {
    label: "Graduación",
    hook: "Todo el esfuerzo de estos años cabe en una imagen inolvidable",
    audience: "Estudiantes y familias en temporada de graduación",
  },
  cumpleanos: {
    label: "Cumpleaños",
    hook: "Tu cumpleaños merece más que fotos improvisadas",
    audience: "Personas con una celebración próxima",
  },
  embarazada: {
    label: "Embarazada",
    hook: "Esta espera pasa una vez; conviértela en un recuerdo para siempre",
    audience: "Futuras madres y parejas",
  },
  boda: {
    label: "Bodas",
    hook: "Tu historia merece fotografías que vuelvan a emocionarte",
    audience: "Parejas comprometidas",
  },
  corporativo: {
    label: "Corporativo",
    hook: "Tu imagen también comunica la calidad de tu trabajo",
    audience: "Profesionales, marcas y negocios",
  },
  general: {
    label: "Fotografía",
    hook: "Convierte tu momento en un recuerdo con acabado profesional",
    audience: "Personas interesadas en fotografía profesional",
  },
};

const wizardIds = [
  "wizardService", "wizardSlots", "wizardDeadline", "wizardGoal", "wizardPrice",
  "wizardDeposit", "wizardVariableCost", "wizardProfit", "wizardRoas", "wizardOffer",
  "wizardStage", "wizardAudienceSource", "wizardLocation", "wizardRadius", "wizardAgeMin",
  "wizardAgeMax", "wizardConsent", "wizardCreativeMode", "wizardConcept", "wizardPeopleVisible",
  "wizardModelRelease", "wizardContainsMinor", "wizardGuardianRelease", "wizardCopy",
  "wizardAvailabilityVerified", "wizardProofVerified", "wizardCashCap", "wizardDays",
  "wizardHistoricalCost", "wizardQualifiedRate", "wizardCompletedRate", "wizardNoShowRate",
  "wizardDestination", "wizardSla", "wizardQuestions",
];

function wizardValues() {
  const values = {};
  for (const id of wizardIds) {
    const el = $(id);
    if (el) values[id] = el.type === "checkbox" ? el.checked : el.value;
  }
  values.assetFamilies = Array.from(document.querySelectorAll("[data-asset-family]:checked")).map((x) => x.dataset.assetFamily);
  values.templateId = wizardTemplateId;
  values.step = wizardStep;
  return values;
}

function saveWizard() {
  try {
    const all = JSON.parse(localStorage.getItem(WIZARD_KEY) || "{}");
    all[selectedBusiness()] = wizardValues();
    localStorage.setItem(WIZARD_KEY, JSON.stringify(all));
  } catch (error) {
    console.warn("wizard-autosave", error);
  }
}

function restoreWizard() {
  try {
    const saved = JSON.parse(localStorage.getItem(WIZARD_KEY) || "{}")[selectedBusiness()];
    if (!saved) return;
    for (const id of wizardIds) {
      const el = $(id);
      if (!el || saved[id] === undefined) continue;
      if (el.type === "checkbox") el.checked = Boolean(saved[id]);
      else el.value = saved[id];
    }
    document.querySelectorAll("[data-asset-family]").forEach((el) => {
      el.checked = (saved.assetFamilies || []).includes(el.dataset.assetFamily);
    });
    wizardTemplateId = saved.templateId || wizardTemplateId;
    wizardStep = Math.max(0, Math.min(7, Number(saved.step) || 0));
  } catch (error) {
    console.warn("wizard-restore", error);
  }
}

function wizardBudget() {
  return saleAds.calculateBudget({
    price: $("wizardPrice").value,
    variable_cost: $("wizardVariableCost").value,
    desired_profit_after_ads: $("wizardProfit").value,
    target_revenue_roas: $("wizardRoas").value,
    available_slots: $("wizardSlots").value,
    campaign_days: $("wizardDays").value,
    cash_budget_cap: $("wizardCashCap").value,
    historical_cost_per_event: $("wizardHistoricalCost").value,
    qualified_to_booking_rate: $("wizardQualifiedRate").value,
    booking_to_completed_rate: $("wizardCompletedRate").value,
    refund_or_no_show_rate: $("wizardNoShowRate").value,
  });
}

function wizardLint() {
  return saleAds.lintPolicy({
    copy: $("wizardCopy").value,
    availability_verified: $("wizardAvailabilityVerified").checked,
    proof_verified: $("wizardProofVerified").checked,
    people_visible: $("wizardPeopleVisible").checked,
    model_release: $("wizardModelRelease").checked,
    contains_minor: $("wizardContainsMinor").checked,
    guardian_release: $("wizardGuardianRelease").checked,
    destination_https: true,
  });
}

function renderWizardTemplates() {
  const recommendations = saleAds.recommendTemplates({ service: $("wizardService").value, stage: $("wizardStage").value });
  if (!recommendations.some((x) => x.id === wizardTemplateId)) wizardTemplateId = recommendations[0]?.id || "T01";
  $("wizardTemplatePicker").innerHTML = recommendations.map((x) =>
    `<article class="template-card selectable ${x.id === wizardTemplateId ? "selected" : ""}" data-template-id="${x.id}" tabindex="0"><span class="template-id">${x.id} · v${x.version}</span><b>${escapeHtml(x.name)}</b><span>${escapeHtml(x.evidence)}</span><small>KPI: ${escapeHtml(x.primary_metric)}</small><small>Riesgo: ${escapeHtml(x.risk)}</small></article>`,
  ).join("");
  $("wizardTemplatePicker").querySelectorAll("[data-template-id]").forEach((el) => {
    const choose = () => { wizardTemplateId = el.dataset.templateId; updateWizard(); };
    el.onclick = choose;
    el.onkeydown = (event) => { if (event.key === "Enter" || event.key === " ") choose(); };
  });
}

function renderTemplateLibrary() {
  $("templateLibrary").innerHTML = saleAds.templates.map((x) =>
    `<article class="template-card"><span class="template-id">${x.id} · versión ${x.version}</span><b>${escapeHtml(x.name)}</b><span>Etapas: ${escapeHtml(x.stages.join(", "))}</span><span>Destino: ${escapeHtml(x.destination)}</span><small>KPI: ${escapeHtml(x.primary_metric)}</small><small>Evidencia: ${escapeHtml(x.evidence)}</small><small>Riesgo: ${escapeHtml(x.risk)}</small></article>`,
  ).join("");
}

function renderCreativeSpecs() {
  $("creativeSpecGrid").innerHTML = saleAds.creativeSpecs.map((x) =>
    `<article class="spec-card"><span class="template-id">${escapeHtml(x.ratio)}</span><b>${escapeHtml(x.label)}</b><span>${x.width}×${x.height}</span><span>${escapeHtml(x.placements.join(" · "))}</span><small>Fuente registrada: Meta Ads Guide</small><small>Estado: requiere revalidación autenticada antes de publicar</small></article>`,
  ).join("");
}

function releaseStudioSource() {
  if (studioSource.objectUrl) URL.revokeObjectURL(studioSource.objectUrl);
  studioSource = { file: null, image: null, objectUrl: "", plan: null };
}

function loadStudioImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ file, image, objectUrl, plan: null });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("La fotografía no pudo decodificarse."));
    };
    image.src = objectUrl;
  });
}

function studioInput() {
  const file = studioSource.file;
  return {
    name: clean($("assetName")?.value) || clean($("wizardService")?.value) || "creativo-dcarela",
    source_width: studioSource.image?.naturalWidth || 0,
    source_height: studioSource.image?.naturalHeight || 0,
    size_bytes: file?.size || 0,
    mime: file?.type || "",
    focus_x: Number($("studioFocusX").value) / 100,
    focus_y: Number($("studioFocusY").value) / 100,
  };
}

function studioCopy() {
  return {
    headline: clean($("studioHeadline").value) || "Fotografía profesional D' Carela",
    cta: clean($("studioCta").value) || "Reservar por WhatsApp",
  };
}

function wrapCanvasText(context, text, maxWidth, maxLines = 3) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && context.measureText(next).width > maxWidth) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else current = next;
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

function drawStudioCanvas(canvas, variant, showGuide) {
  if (!studioSource.image) return;
  const previewScale = showGuide ? Math.min(1, 360 / variant.height, 320 / variant.width) : 1;
  canvas.width = Math.max(1, Math.round(variant.width * previewScale));
  canvas.height = Math.max(1, Math.round(variant.height * previewScale));
  const context = canvas.getContext("2d", { alpha: false });
  const crop = variant.crop;
  context.drawImage(studioSource.image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);

  const safe = variant.safe_zone;
  const left = canvas.width * safe.left_pct / 100;
  const right = canvas.width * (1 - safe.right_pct / 100);
  const top = canvas.height * safe.top_pct / 100;
  const bottom = canvas.height * (1 - safe.bottom_pct / 100);
  const gradient = context.createLinearGradient(0, canvas.height * 0.35, 0, canvas.height);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,.88)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const copy = studioCopy();
  const unit = Math.max(1, canvas.width / 1080);
  context.fillStyle = "#ffffff";
  context.font = `800 ${Math.round(38 * unit)}px Arial, sans-serif`;
  context.fillText("D' CARELA COMPUFOTO", left, Math.max(top + 38 * unit, 44 * unit));
  context.font = `800 ${Math.round(70 * unit)}px Arial, sans-serif`;
  const lines = wrapCanvasText(context, copy.headline, Math.max(120, right - left), 3);
  const lineHeight = 78 * unit;
  const ctaHeight = 82 * unit;
  let y = Math.max(top + 120 * unit, bottom - ctaHeight - lines.length * lineHeight - 28 * unit);
  for (const line of lines) {
    context.fillText(line, left, y);
    y += lineHeight;
  }
  context.fillStyle = "#ff7a00";
  context.beginPath();
  context.roundRect(left, y + 10 * unit, Math.min(right - left, 520 * unit), ctaHeight, 18 * unit);
  context.fill();
  context.fillStyle = "#111111";
  context.font = `800 ${Math.round(34 * unit)}px Arial, sans-serif`;
  context.fillText(copy.cta, left + 28 * unit, y + 64 * unit);

  if (showGuide) {
    context.save();
    context.setLineDash([10, 8]);
    context.strokeStyle = "rgba(255,255,255,.85)";
    context.lineWidth = Math.max(1, 3 * unit);
    context.strokeRect(left, top, right - left, bottom - top);
    context.restore();
  }
}

function renderCreativeStudio() {
  const preview = $("studioPreview");
  const plan = studioSource.plan;
  if (!plan || plan.blocked || !studioSource.image) {
    preview.innerHTML = "";
    $("studioManifest").disabled = true;
    return;
  }
  preview.innerHTML = plan.variants.map((variant) =>
    `<article class="studio-card"><div><b>${escapeHtml(variant.label)} · ${escapeHtml(variant.ratio)}</b><small>${variant.width}×${variant.height} · ${escapeHtml(variant.placements.join(" · "))}</small></div><canvas data-studio-canvas="${escapeHtml(variant.id)}" aria-label="Vista previa ${escapeHtml(variant.label)}"></canvas><button class="secondary" type="button" data-studio-download="${escapeHtml(variant.id)}">Descargar JPG</button></article>`,
  ).join("");
  for (const variant of plan.variants) {
    const canvas = preview.querySelector(`[data-studio-canvas="${variant.id}"]`);
    drawStudioCanvas(canvas, variant, true);
  }
  $("studioManifest").disabled = false;
}

function generateStudioPackage() {
  if (!studioSource.image || !studioSource.file) {
    $("studioStatus").textContent = "Selecciona primero una fotografía JPG, PNG o WebP.";
    return;
  }
  const plan = saleAds.planCreativeVariants(studioInput());
  studioSource.plan = plan;
  const issues = plan.issues.map((issue) => `<div class="qa-item ${issue.severity === "block" ? "danger-text" : "warning-text"}">${escapeHtml(issue.message)}</div>`).join("");
  $("studioStatus").innerHTML = plan.blocked
    ? issues
    : `<span class="success-text">Tres composiciones generadas en memoria. La línea punteada marca la zona segura y no aparece en la descarga.</span>${issues}`;
  renderCreativeStudio();
}

async function downloadStudioVariant(id) {
  const variant = studioSource.plan?.variants.find((row) => row.id === id);
  if (!variant || !studioSource.image) return;
  const canvas = document.createElement("canvas");
  drawStudioCanvas(canvas, variant, false);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) throw new Error("El navegador no pudo generar el JPG.");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = variant.file_name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadStudioManifest() {
  if (!studioSource.plan || studioSource.plan.blocked) return;
  const manifest = {
    schema_version: 1,
    generator: BUILD,
    generated_at: new Date().toISOString(),
    business_id: selectedBusiness(),
    source_file_uploaded: false,
    source_dimensions: { width: studioSource.image.naturalWidth, height: studioSource.image.naturalHeight },
    copy: studioCopy(),
    variants: studioSource.plan.variants,
    qa: { human_review_required: true, meta_publish_enabled: false, spend_enabled: false },
  };
  download(JSON.stringify(manifest, null, 2), `saleads-paquete-${Date.now()}.json`, "application/json");
}

function renderBudgetResult(result) {
  $("wizardBudgetResult").innerHTML = `<div class="budget-cards"><article><span>CAC tolerable</span><b>${escapeHtml(money(result.allowable_cac))}</b></article><article><span>Tope por capacidad</span><b>${escapeHtml(money(result.capacity_budget_cap))}</b></article><article><span>Tope diario sugerido</span><b>${escapeHtml(money(result.recommended_daily_cap))}</b></article></div>${result.scenarios.map((x) => `<div class="qa-item"><b>${escapeHtml(x.label)}</b> · ${escapeHtml(money(x.total))}${x.feasible === false ? " · no viable con el tope actual" : ""}</div>`).join("")}${result.warnings.map((x) => `<div class="qa-item warning-text">${escapeHtml(x)}</div>`).join("")}`;
}

function renderLint(result) {
  $("wizardLint").innerHTML = result.issues.length
    ? result.issues.map((x) => `<div class="qa-item ${x.severity === "block" ? "danger-text" : "warning-text"}">${escapeHtml(x.message)}</div>`).join("")
    : '<span class="success-text">Sin bloqueos detectados en los campos disponibles.</span>';
}

function renderWizardReview(budget, lint) {
  const template = saleAds.templates.find((x) => x.id === wizardTemplateId);
  const assets = wizardValues().assetFamilies || [];
  const placementRows = saleAds.validatePlacements(
    ["facebook_feed", "instagram_feed", "facebook_stories", "instagram_stories", "facebook_reels", "instagram_reels", "facebook_marketplace"],
    assets,
  );
  const blocks = [...lint.issues.filter((x) => x.severity === "block").map((x) => x.message)];
  if (!budget.sufficient) blocks.push("Economía incompleta: precio, capacidad y tope de caja son obligatorios.");
  if (!$("wizardDeadline").value) blocks.push("Falta fecha límite real.");
  if ($("wizardAudienceSource").value === "crm_consented" && !$("wizardConsent").checked) blocks.push("La audiencia CRM requiere consentimiento confirmado.");
  if (placementRows.missing.length) blocks.push(`Faltan variantes: ${[...new Set(placementRows.missing.map((x) => x.family))].join(", ")}.`);
  $("wizardReview").innerHTML = [
    ["Servicio", $("wizardService").selectedOptions[0]?.textContent || ""],
    ["Plantilla", `${template?.id || "—"} · ${template?.name || "—"}`],
    ["Economía", `Margen ${money(budget.contribution_margin)} · CAC ${money(budget.allowable_cac)}`],
    ["Activos", assets.length ? assets.join(", ") : "Ninguno"],
    ["Destino", $("wizardDestination").selectedOptions[0]?.textContent || ""],
    ["Estado", blocks.length ? `${blocks.length} bloqueo(s)` : "Borrador apto para guardar"],
  ].map(([a, b]) => `<article><b>${escapeHtml(a)}</b><span>${escapeHtml(b)}</span></article>`).join("")
    + (blocks.length ? `<article class="wide"><b class="danger-text">Antes de guardar</b><span>${blocks.map(escapeHtml).join(" · ")}</span></article>` : "");
  $("wizardCreateDraft").disabled = blocks.length > 0;
  return { blocks, placementRows };
}

function updateWizard() {
  document.querySelectorAll("[data-wizard-panel]").forEach((el) => el.classList.toggle("active", Number(el.dataset.wizardPanel) === wizardStep));
  document.querySelectorAll("[data-wizard-step]").forEach((el) => el.classList.toggle("active", Number(el.dataset.wizardStep) === wizardStep));
  $("wizardPrev").disabled = wizardStep === 0;
  $("wizardNext").hidden = wizardStep === 7;
  $("wizardProgress").textContent = `Paso ${wizardStep + 1} de 8`;
  renderWizardTemplates();
  const budget = wizardBudget();
  const lint = wizardLint();
  renderBudgetResult(budget);
  renderLint(lint);
  const review = renderWizardReview(budget, lint);
  const template = saleAds.templates.find((x) => x.id === wizardTemplateId);
  $("wizardPreviewTitle").textContent = clean($("wizardOffer").value) || template?.name || "Campaña sin nombre";
  $("wizardPreviewBody").innerHTML = `<div class="preview-stat"><span>Plantilla</span><b>${escapeHtml(template?.id || "—")} · ${escapeHtml(template?.name || "—")}</b></div><div class="preview-stat"><span>Tope total</span><b>${escapeHtml(money(budget.recommended_total_cap))}</b></div><div class="preview-stat"><span>Calidad de señal</span><b>${escapeHtml(budget.sample_quality)}</b></div><div class="preview-stat"><span>QA</span><b class="${review.blocks.length ? "danger-text" : "success-text"}">${review.blocks.length ? `${review.blocks.length} bloqueo(s)` : "Apto como borrador"}</b></div>`;
  saveWizard();
}

function validateWizardStep(step) {
  if (step === 1 && (!$("wizardOffer").value.trim() || Number($("wizardPrice").value) <= 0 || Number($("wizardSlots").value) <= 0 || !$("wizardDeadline").value)) return "Completa oferta, precio, espacios y fecha límite reales.";
  if (step === 2 && Number($("wizardAgeMin").value) > Number($("wizardAgeMax").value)) return "La edad mínima no puede superar la máxima.";
  if (step === 2 && $("wizardAudienceSource").value === "crm_consented" && !$("wizardConsent").checked) return "Confirma el consentimiento aplicable para usar el CRM.";
  if (step === 4 && wizardLint().blocked) return "Corrige los bloqueos del linter antes de continuar.";
  if (step === 5 && !wizardBudget().sufficient) return "Completa la economía y la capacidad antes de continuar.";
  return "";
}

function createWizardDraft() {
  const budget = wizardBudget();
  const lint = wizardLint();
  const review = renderWizardReview(budget, lint);
  if (review.blocks.length) throw new Error("La revisión todavía contiene bloqueos.");
  const template = saleAds.templates.find((x) => x.id === wizardTemplateId);
  $("product").value = $("wizardService").selectedOptions[0]?.textContent || $("wizardService").value;
  $("offer").value = $("wizardOffer").value;
  $("price").value = $("wizardPrice").value;
  $("objective").value = $("wizardGoal").value === "paid_order" ? "traffic" : "leads";
  $("funnel").value = ["cold", "warm", "hot", "remarketing", "loyalty"].includes($("wizardStage").value) ? $("wizardStage").value : "cold";
  $("destination").value = $("wizardDestination").value === "web" ? "web" : "whatsapp";
  $("budget").value = budget.recommended_total_cap;
  $("days").value = $("wizardDays").value;
  $("startDate").value = new Date().toISOString().slice(0, 10);
  $("location").value = $("wizardLocation").value;
  $("radius").value = $("wizardRadius").value;
  $("ageMin").value = $("wizardAgeMin").value;
  $("ageMax").value = $("wizardAgeMax").value;
  $("urgency").value = $("wizardAvailabilityVerified").checked ? `Disponibilidad verificada hasta ${$("wizardDeadline").value}` : "";
  $("notes").value = $("wizardConcept").value;
  current = {
    ...generatePackage(),
    schema_version: 3,
    builder: "saleads_wizard_v3",
    template_ref: { id: template.id, version: template.version },
    business_goal: $("wizardGoal").value,
    capacity_snapshot: { available_slots: Number($("wizardSlots").value), deadline: $("wizardDeadline").value },
    economics_snapshot: { price: Number($("wizardPrice").value), deposit: Number($("wizardDeposit").value), variable_cost: Number($("wizardVariableCost").value), desired_profit_after_ads: Number($("wizardProfit").value), ...budget },
    audience_definition: { stage: $("wizardStage").value, source: $("wizardAudienceSource").value, consent_confirmed: $("wizardConsent").checked },
    creative_asset_families: wizardValues().assetFamilies,
    policy_qa: { blocked: lint.blocked, issues: lint.issues },
    remote_status: "not_connected",
    approval: { required: true, approved: false },
  };
  saveLocal(current);
  renderOutput();
  showView("builder");
  toast("Borrador rector creado. Revísalo y guárdalo si corresponde.");
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
}
function localCampaigns() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveLocal(item) {
  const list = localCampaigns().filter((x) => x.id !== item.id);
  list.unshift(item);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 30)));
}
function selectedBusiness() {
  return (
    $("businessSelect").value ||
    businesses[0]?.id ||
    member?.business_ids?.[0] ||
    "dcarela"
  );
}
function categoryFor(value) {
  const text = clean(value).toLowerCase();
  return (
    Object.keys(PRESETS).find((k) => text.includes(k)) ||
    (/embaraz/.test(text)
      ? "embarazada"
      : /quince|15/.test(text)
        ? "xv"
        : "general")
  );
}
function segmentRows(segment) {
  const rows = clients.filter((x) => x.business_id === selectedBusiness());
  if (segment === "phone")
    return rows.filter(
      (x) => normalizePhone(x.telefono || x.phone).length >= 10,
    );
  if (segment === "debt_free")
    return rows.filter(
      (x) => Number(x.saldoCentavos ?? x.balanceCentavos ?? 0) <= 0,
    );
  if (segment === "debt")
    return rows.filter(
      (x) => Number(x.saldoCentavos ?? x.balanceCentavos ?? 0) > 0,
    );
  return rows;
}

async function loadAccess(user) {
  const snap = await getDoc(doc(db, "business_members", user.uid));
  if (!snap.exists()) throw new Error("Esta cuenta no tiene acceso asignado.");
  member = snap.data() || {};
  if (member.active !== true) throw new Error("Esta cuenta está inactiva.");
  const ids = Array.isArray(member.business_ids)
    ? member.business_ids.filter(Boolean)
    : [];
  if (!ids.length) throw new Error("La cuenta no tiene sucursales asignadas.");
  businesses = [];
  for (const id of ids) {
    const s = await getDoc(doc(db, "businesses", id));
    const d = s.exists() ? s.data() : {};
    businesses.push({ id, name: d.name || d.nombre || id });
  }
  $("businessSelect").innerHTML = businesses
    .map(
      (x) =>
        `<option value="${escapeHtml(x.id)}">${escapeHtml(x.name)}</option>`,
    )
    .join("");
  $("userName").textContent = member.display_name || member.name || user.email;
  $("syncStatus").textContent =
    `Firebase activo · ${businesses.length} sucursal(es)`;
}
async function loadBusinessData() {
  const ids = member.business_ids || [];
  clients = [];
  products = [];
  for (const businessId of ids) {
    const [cs, ps] = await Promise.all([
      getDocs(
        query(
          collection(db, "clients"),
          where("business_id", "==", businessId),
        ),
      ),
      getDocs(
        query(
          collection(db, "products"),
          where("business_id", "==", businessId),
        ),
      ),
    ]);
    cs.forEach((s) => clients.push({ id: s.id, ...s.data() }));
    ps.forEach((s) => products.push({ id: s.id, ...s.data() }));
  }
  renderBusinessData();
  await loadCampaigns();
}
function renderBusinessData() {
  const bid = selectedBusiness(),
    c = clients.filter((x) => x.business_id === bid),
    p = products.filter((x) => x.business_id === bid && x.activo !== false);
  $("kpiClients").textContent = c.length.toLocaleString("es-DO");
  $("kpiPhones").textContent = c
    .filter((x) => normalizePhone(x.telefono || x.phone).length >= 10)
    .length.toLocaleString("es-DO");
  $("kpiProducts").textContent = p.length.toLocaleString("es-DO");
  $("overviewClients").textContent = c.length.toLocaleString("es-DO");
  $("overviewProducts").textContent = p.length.toLocaleString("es-DO");
  $("clientBadge").textContent = c.length.toLocaleString("es-DO");
  $("productSelect").innerHTML =
    '<option value="">Escribir manualmente</option>' +
    p
      .sort((a, b) =>
        clean(a.nombre || a.name).localeCompare(
          clean(b.nombre || b.name),
          "es",
        ),
      )
      .slice(0, 2500)
      .map(
        (x) =>
          `<option value="${escapeHtml(x.id)}">${escapeHtml(x.nombre || x.name || "Producto")}</option>`,
      )
      .join("");
  renderAudience();
  loadOperationData().catch((error) => console.warn("operations", error));
}
async function loadCampaigns() {
  const bid = selectedBusiness();
  try {
    const snap = await getDocs(
      query(collection(db, "crm_campaigns"), where("business_id", "==", bid)),
    );
    campaigns = [];
    snap.forEach((s) => {
      const d = s.data() || {};
      if (d.campaign_type === "automated_ad")
        campaigns.push({ id: s.id, ...d });
    });
    campaigns.sort((a, b) =>
      clean(b.updated_at || b.created_at).localeCompare(
        clean(a.updated_at || a.created_at),
      ),
    );
  } catch (error) {
    console.warn("campaigns", error);
    campaigns = localCampaigns().filter((x) => x.business_id === bid);
  }
  $("kpiDrafts").textContent = campaigns.length.toLocaleString("es-DO");
  $("overviewDrafts").textContent = campaigns.length.toLocaleString("es-DO");
  $("historyBadge").textContent = campaigns.length.toLocaleString("es-DO");
  renderHistory();
  renderApprovals();
  renderAnalytics();
}

function formValues() {
  const product = clean($("product").value),
    category = categoryFor(product);
  return {
    product,
    category,
    offer: clean($("offer").value),
    price: Number($("price").value) || 0,
    objective: $("objective").value,
    funnel: $("funnel").value,
    destination: $("destination").value,
    segment: $("segment").value,
    tone: $("tone").value,
    budget: Number($("budget").value) || 0,
    days: Math.max(1, Number($("days").value) || 1),
    start_date: $("startDate").value,
    format: $("format").value,
    placements: $("placements").value,
    location: clean($("location").value),
    radius: Number($("radius").value) || 25,
    age_min: Number($("ageMin").value) || 18,
    age_max: Number($("ageMax").value) || 55,
    proof: clean($("proof").value),
    urgency: clean($("urgency").value),
    notes: clean($("notes").value),
    creative_name: $("creative").files[0]?.name || "",
  };
}
function generatePackage() {
  const f = formValues();
  if (!f.product || !f.offer || f.budget < 1)
    throw new Error("Completa producto, oferta y presupuesto.");
  if (f.age_min > f.age_max)
    throw new Error("La edad mínima no puede superar la máxima.");
  const preset = PRESETS[f.category],
    daily = f.budget / f.days,
    segment = segmentRows(f.segment);
  const web = new URL("https://dcarelacompufoto.com/combos.html");
  web.searchParams.set("cat", f.category);
  web.searchParams.set("utm_source", "meta");
  web.searchParams.set("utm_medium", "paid_social");
  web.searchParams.set("utm_campaign", `dcarela_${f.category}_${Date.now()}`);
  const msg = `Hola, vi el anuncio de ${f.product} y quiero información para reservar.`;
  const whatsapp = `https://wa.me/18495245620?text=${encodeURIComponent(msg)}`;
  const price = f.price ? ` Desde ${money(f.price)}.` : "";
  const proof = f.proof ? ` ${f.proof}.` : "";
  const urgency = f.urgency
    ? ` ${f.urgency}.`
    : " Cupos sujetos a disponibilidad.";
  const lead =
    f.tone === "emotional"
      ? "Imagina volver a sentir este momento cada vez que mires tus fotos."
      : f.tone === "direct"
        ? "Reserva tu sesión profesional en La Romana."
        : "Creamos una experiencia cuidada, profesional y coherente con tu estilo.";
  const copies = [
    `${preset.hook}. ${lead}\n\n${f.product}: ${f.offer}.${price}${proof}\n\nEscríbenos para confirmar disponibilidad.${urgency}`,
    `${f.offer}. ✨${price}\n\nEn D'Carela te guiamos antes y durante tu experiencia para lograr un resultado auténtico.${proof}${urgency}`,
    `¿Buscas ${f.product.toLowerCase()} en La Romana? ${preset.hook}.\n\n${f.offer}.${price} Toca el botón y recibe los detalles sin compromiso.${urgency}`,
  ];
  return {
    id: `ads_${auth.currentUser.uid}_${Date.now()}`,
    schema: "dcarela.ads.package.v2",
    campaign_type: "automated_ad",
    status: "draft_review_required",
    business_id: selectedBusiness(),
    created_by_uid: auth.currentUser.uid,
    created_by_email: auth.currentUser.email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...f,
    audience_count: segment.length,
    audience_summary:
      f.segment === "phone"
        ? `${segment.length} clientes con teléfono registrado`
        : f.segment === "debt_free"
          ? `${segment.length} clientes sin saldo pendiente`
          : f.segment === "debt"
            ? `${segment.length} clientes con saldo; excluidos de activación publicitaria`
            : `${segment.length} clientes visibles en la sucursal`,
    recommended_audience: preset.audience,
    daily_budget: daily,
    campaign_name: `DCARELA | ${preset.label} | ${f.objective.toUpperCase()} | ${f.start_date || new Date().toISOString().slice(0, 10)}`,
    adset_name: `${f.location} ${f.radius}km | ${f.age_min}-${f.age_max} | ${money(daily)}/día`,
    copy_variants: copies,
    headline: `${preset.label}: conoce la oferta`,
    description: `${f.offer}${f.price ? ` · Desde ${money(f.price)}` : ""}`,
    destinations: { web: web.href, whatsapp, message: msg },
    creative_brief: `Usar material real, nítido y autorizado de ${preset.label.toLowerCase()}. Priorizar una sola promesa, poco texto en imagen, encuadre adaptable a feed, reel e historia.`,
    ab_test:
      "Probar Copy 1 contra Copy 3 con el mismo creativo durante al menos 3 días. Conservar la variante con mejor costo por resultado sin aumentar presupuesto automáticamente.",
    follow_up:
      "Responder rápido, confirmar categoría y fecha, presentar el combo adecuado y conducir a separación y agenda.",
    checklist: [
      "Confirmar autorización del creativo",
      "Revisar ortografía, precio, vigencia y disponibilidad",
      "Probar WhatsApp y enlace web con UTM",
      "Confirmar presupuesto, fechas y método de pago en Meta",
      "Publicar solo después de aprobación humana",
    ],
  };
}
function resultText(x) {
  return [
    `PAQUETE DE ANUNCIO D'CARELA`,
    `Estado: BORRADOR — REQUIERE REVISIÓN`,
    `Campaña: ${x.campaign_name}`,
    `Conjunto: ${x.adset_name}`,
    `Producto: ${x.product}`,
    `Oferta: ${x.offer}`,
    `Presupuesto: ${money(x.budget)} total · ${money(x.daily_budget)}/día · ${x.days} días`,
    `Audiencia sugerida: ${x.recommended_audience}`,
    `Banco interno: ${x.audience_summary}`,
    ``,
    `COPYS`,
    ...x.copy_variants.flatMap((c, i) => [`Copy ${i + 1}:`, c, ``]),
    `Titular: ${x.headline}`,
    `Descripción: ${x.description}`,
    `Web: ${x.destinations.web}`,
    `WhatsApp: ${x.destinations.whatsapp}`,
    `Prueba A/B: ${x.ab_test}`,
    `Seguimiento: ${x.follow_up}`,
    ``,
    `CHECKLIST`,
    ...x.checklist.map((v) => `[ ] ${v}`),
  ].join("\n");
}
function renderOutput() {
  if (!current) return;
  $("outputEmpty").hidden = true;
  $("output").hidden = false;
  $("draftState").textContent =
    current.status === "saved" ? "Guardado en Firebase" : "Borrador local";
  $("output").innerHTML =
    `<div class="summary"><div><span>Presupuesto diario</span><b>${escapeHtml(money(current.daily_budget))}</b></div><div><span>Duración</span><b>${current.days} días</b></div><div><span>Audiencia interna</span><b>${current.audience_count}</b></div></div><article class="result-card"><h4>Campaña</h4><p>${escapeHtml(current.campaign_name)}</p><small>${escapeHtml(current.adset_name)}</small></article><article class="result-card"><h4>Público recomendado</h4><p>${escapeHtml(current.recommended_audience)}</p><small>${escapeHtml(current.audience_summary)} · los datos personales no se envían a Meta</small></article>${current.copy_variants.map((x, i) => `<article class="result-card"><h4>Copy ${i + 1}</h4><p>${escapeHtml(x)}</p></article>`).join("")}<article class="result-card"><h4>Destino y seguimiento</h4><p>${escapeHtml(current.destinations.web)}\n${escapeHtml(current.destinations.whatsapp)}</p><small>${escapeHtml(current.follow_up)}</small></article><article class="result-card"><h4>Prueba A/B</h4><p>${escapeHtml(current.ab_test)}</p></article><article class="result-card"><h4>Checklist</h4><pre>${current.checklist.map((x) => "□ " + escapeHtml(x)).join("\n")}</pre></article>`;
  ["saveButton", "copyButton", "txtButton", "jsonButton"].forEach(
    (id) => ($(id).disabled = false),
  );
  $("metaButton").classList.remove("disabled");
}
async function saveCurrent() {
  if (!current) return;
  const role = roleForBusiness();
  if (!["owner", "admin"].includes(role)) {
    saveLocal(current);
    toast(
      "Guardado solo en este dispositivo: tu rol no permite escribir en la nube.",
    );
    return;
  }
  const cloud = {
    ...current,
    status: "saved",
    updated_at: new Date().toISOString(),
  };
  await setDoc(doc(db, "crm_campaigns", cloud.id), cloud);
  current = cloud;
  saveLocal(cloud);
  renderOutput();
  await loadCampaigns();
  toast("Borrador guardado en Firebase.");
}

function renderOperations() {
  renderCreativeAssets();
  renderCapacity();
  renderExperiments();
  renderAnalytics();
  renderApprovals();
  renderAuditTrail();
  renderSyncBanner();
}
async function loadOperationData() {
  const businessId = selectedBusiness();
  for (const kind of OPERATION_KINDS) assignOperationRows(kind, cachedRows(kind));
  renderOperations();
  setSyncState("loading", "Leyendo activos, capacidad, experimentos y atribucion de la sucursal.");
  if (!auth.currentUser) {
    setSyncState("expired", "Inicia sesion para sincronizar; se muestra la copia de este dispositivo.");
    return;
  }
  let cloud;
  try {
    cloud = await fetchOperationCloud(businessId);
  } catch (error) {
    console.warn("operations-sync", error);
    const info = saleAds.describeSyncError(error, { online: navigator.onLine });
    setSyncState(info.state, info.message);
    return;
  }
  for (const kind of OPERATION_KINDS) {
    const merged = saleAds.mergeOperationRows(kind, cachedRows(kind), cloud[kind] || [], businessId);
    assignOperationRows(kind, merged);
    cacheRows(kind, merged);
  }
  renderOperations();
  await syncPendingOperations(businessId, cloud);
  renderOperations();
}
function renderAuditTrail() {
  if (!$("auditTrail")) return;
  $("auditTrail").innerHTML = auditEntries.length
    ? auditEntries.slice(0, 40).map((x) => `<article class="record-row"><div><b>${escapeHtml(x.action)}</b><span>${escapeHtml(x.detail || x.entity || "")}</span><small>${escapeHtml(x.actor_email || "sin actor")} · ${new Date(x.created_at).toLocaleString("es-DO")}</small></div><span class="status-chip ${x.sync_state === "synced" ? "success-text" : "warning-text"}">${x.sync_state === "synced" ? "en la sucursal" : "pendiente"}</span></article>`).join("")
    : '<div class="empty-state-inline">Sin acciones registradas en esta sucursal.</div>';
}

function assetFormValue() {
  return {
    name: clean($("assetName").value),
    family: $("assetFamily").value,
    rights_expires_at: $("assetRightsUntil").value,
    rights_scope: clean($("assetRightsScope").value),
    people_visible: $("assetPeople").checked,
    model_release: $("assetModelRelease").checked,
    contains_minor: $("assetMinor").checked,
    guardian_release: $("assetGuardian").checked,
  };
}
function updateAssetQa() {
  const result = saleAds.validateCreativeAsset(assetFormValue());
  $("assetQa").innerHTML = result.issues.length
    ? result.issues.map((x) => `<div class="qa-item ${x.severity === "block" ? "danger-text" : "warning-text"}">${escapeHtml(x.message)}</div>`).join("")
    : '<span class="success-text">Activo apto para biblioteca; todavía requiere preview final por placement.</span>';
  return result;
}
function renderCreativeAssets() {
  $("assetLibrary").innerHTML = creativeAssets.length
    ? creativeAssets.map((x) => {
        const qa = saleAds.validateCreativeAsset(x);
        return `<article class="record-row"><div><b>${escapeHtml(x.name)}</b><span>${escapeHtml(x.family)} · derechos: ${escapeHtml(x.rights_expires_at || "sin vencimiento registrado")}</span><small>${escapeHtml(x.rights_scope || "Alcance pendiente")}</small></div><span class="status-chip ${qa.blocked ? "danger-text" : "success-text"}">${qa.blocked ? "Bloqueado" : "QA base"}</span></article>`;
      }).join("")
    : '<div class="empty-state-inline">No hay activos registrados para esta sucursal.</div>';
}

function renderCapacity() {
  const summary = saleAds.capacitySummary(capacityEntries);
  $("capacityDays").textContent = summary.days;
  $("capacitySlots").textContent = summary.slots;
  $("capacityReserved").textContent = summary.reserved;
  $("capacityAvailable").textContent = summary.available;
  $("capacityList").innerHTML = capacityEntries.length
    ? [...capacityEntries].sort((a, b) => a.date.localeCompare(b.date)).map((x) => {
        const available = Math.max(0, Number(x.slots) - Math.min(Number(x.slots), Number(x.reserved)));
        return `<article class="record-row"><div><b>${escapeHtml(x.date)} · ${escapeHtml(x.service)}</b><span>${x.reserved} reservado(s) de ${x.slots}</span></div><span class="status-chip">${available} libres</span></article>`;
      }).join("")
    : '<div class="empty-state-inline">Carga fechas reales antes de usar urgencia o cupos en un anuncio.</div>';
}

function experimentFormValue() {
  return {
    hypothesis: clean($("experimentHypothesis").value),
    variable: $("experimentVariable").value,
    metric: $("experimentMetric").value,
    minimum_events: $("experimentMinimum").value,
    control_events: $("experimentControlEvents").value,
    control_spend: $("experimentControlSpend").value,
    challenger_events: $("experimentVariantEvents").value,
    challenger_spend: $("experimentVariantSpend").value,
  };
}
function updateExperimentDecision() {
  const result = saleAds.evaluateExperiment(experimentFormValue());
  $("experimentDecision").innerHTML = `<b>${escapeHtml(result.decision)}</b><div class="qa-item">${escapeHtml(result.reason)}</div><small>Control: ${result.control_cost === null ? "sin dato" : money(result.control_cost)} · Variante: ${result.challenger_cost === null ? "sin dato" : money(result.challenger_cost)} · confianza ${escapeHtml(result.confidence)}</small>`;
  return result;
}
function renderExperiments() {
  $("experimentList").innerHTML = experimentRecords.length
    ? experimentRecords.map((x) => `<article class="record-row"><div><b>${escapeHtml(x.hypothesis)}</b><span>${escapeHtml(x.variable)} · ${escapeHtml(x.metric)}</span><small>${escapeHtml(x.result.reason)}</small></div><span class="status-chip">${escapeHtml(x.result.decision)}</span></article>`).join("")
    : '<div class="empty-state-inline">Sin experimentos registrados. Diseña una prueba con una sola variable.</div>';
}

function renderAnalytics() {
  const metrics = saleAds.funnelMetrics(attributionEvents);
  const cards = [
    ["Leads", metrics.lead], ["Calificados", metrics.qualified], ["Reservas", metrics.booking],
    ["Sesiones", metrics.completed], ["Pagadas", metrics.paid], ["Ingreso", money(metrics.revenue)],
  ];
  $("funnelGrid").innerHTML = cards.map(([label, value], index) => `<article><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b><small>${index === 5 ? "confirmado manualmente" : "eventos registrados"}</small></article>`).join("");
  $("attributionCampaign").innerHTML = '<option value="">Sin campaña asignada</option>' + campaigns.map((x) => `<option value="${escapeHtml(x.id)}">${escapeHtml(x.product || x.campaign_name || x.id)}</option>`).join("");
  $("attributionList").innerHTML = attributionEvents.length
    ? attributionEvents.map((x) => `<article class="record-row"><div><b>${escapeHtml(x.stage)} · ${escapeHtml(x.reference || "sin referencia")}</b><span>${escapeHtml(campaigns.find((c) => c.id === x.campaign_id)?.campaign_name || "Sin campaña")}</span><small>${new Date(x.created_at).toLocaleString("es-DO")}</small></div><span class="status-chip">${x.value ? escapeHtml(money(x.value)) : "señal"}</span></article>`).join("")
    : '<div class="empty-state-inline">Sin eventos atribuidos. No se calcula ROAS hasta conectar gasto Meta verificable.</div>';
}

function renderApprovals() {
  if (!$("approvalList")) return;
  const rows = campaigns.filter((x) => ["draft_review_required", "saved", "qa_ready", "approved"].includes(x.status));
  $("approvalList").innerHTML = rows.length
    ? rows.map((x) => `<article class="record-row"><div><b>${escapeHtml(x.product || x.campaign_name || x.id)}</b><span>${escapeHtml(x.status)}</span><small>${escapeHtml(x.approval?.note || "Sin decisión registrada")}</small></div><span class="status-chip">${escapeHtml(x.status)}</span></article>`).join("")
    : '<div class="empty-state-inline">No hay campañas pendientes de revisión.</div>';
  $("approvalCampaign").innerHTML = rows.map((x) => `<option value="${escapeHtml(x.id)}">${escapeHtml(x.product || x.campaign_name || x.id)} · ${escapeHtml(x.status)}</option>`).join("");
}

async function registerApproval() {
  if (!["owner", "admin"].includes(roleForBusiness()))
    throw new Error("Solo owner/admin puede registrar una aprobación.");
  const campaign = campaigns.find((x) => x.id === $("approvalCampaign").value);
  if (!campaign) throw new Error("Selecciona una campaña pendiente.");
  const target = $("approvalAction").value;
  const humanApproval = target !== "approved" || clean($("approvalPhrase").value) === "APROBAR BORRADOR";
  if (target === "approved" && !humanApproval)
    throw new Error("Escribe exactamente APROBAR BORRADOR.");
  const note = clean($("approvalNote").value);
  if (!note) throw new Error("La nota de auditoría es obligatoria.");
  const transition = saleAds.canTransitionCampaign(campaign.status, target, { human_approval: humanApproval, meta_backend_connected: false });
  if (!transition.ok) throw new Error(transition.reason);
  const updated = { ...campaign, status: target, updated_at: new Date().toISOString(), approval: { required: true, approved: target === "approved", approved_by_uid: auth.currentUser.uid, approved_by_email: auth.currentUser.email, approved_at: new Date().toISOString(), note } };
  await setDoc(doc(db, "crm_campaigns", updated.id), updated);
  saveLocal(updated);
  await loadCampaigns();
  await recordAudit({
    action: target === "approved" ? "campaign_approved" : "campaign_qa_ready",
    entity: "crm_campaigns",
    entity_id: updated.id,
    detail: note,
  });
  $("approvalForm").reset();
  toast(target === "approved" ? "Borrador aprobado; no se publicó ni activó gasto." : "QA registrado.");
}

function renderAudience() {
  const businessRows = clients.filter((x) => x.business_id === selectedBusiness());
  const summary = saleAds.summarizeAudience(businessRows);
  $("audienceTotal").textContent = summary.total.toLocaleString("es-DO");
  $("audienceConsented").textContent = summary.consented.toLocaleString("es-DO");
  $("audienceExcluded").textContent = (summary.excluded + summary.expired).toLocaleString("es-DO");
  $("audienceContactable").textContent = summary.contactable.toLocaleString("es-DO");
  const q = clean($("clientSearch").value).toLowerCase(),
    rows = businessRows
      .filter(
        (x) =>
          !q ||
          [x.nombre, x.name, x.telefono, x.phone]
            .join(" ")
            .toLowerCase()
            .includes(q),
      );
  $("audienceGrid").innerHTML = rows.length
    ? rows
        .slice(0, 500)
        .map((x) => {
          const name = x.nombre || x.name || "Cliente",
            phone = x.telefono || x.phone || "",
            consent = saleAds.consentState(x),
            digits = normalizePhone(phone),
            maskedPhone = digits ? `•••-•••-${digits.slice(-4)}` : "Sin teléfono";
          const labels = { consented: "Consentimiento vigente", excluded: "Excluido", expired: "Consentimiento vencido", unknown: "Sin consentimiento explícito" };
          return `<article class="client-card"><h3>${escapeHtml(name)}</h3><span class="masked">${escapeHtml(maskedPhone)}</span><small>Referencia interna: ${escapeHtml(x.folio || x.id || "—")}</small><span class="consent-state ${consent === "consented" ? "success-text" : consent === "unknown" ? "warning-text" : "danger-text"}">${escapeHtml(labels[consent])}</span></article>`;
        })
        .join("")
    : '<div class="empty-list">No hay clientes para esta búsqueda.</div>';
}
function renderHistory() {
  const filter = $("campaignStatusFilter")?.value || "";
  const visible = campaigns.filter((x) => !filter || x.status === filter);
  $("historyGrid").innerHTML = visible.length
    ? visible
        .map(
          (x) =>
            `<article class="history-card" data-id="${escapeHtml(x.id)}"><span class="status-chip">${escapeHtml(x.status || "draft")}</span><h3>${escapeHtml(x.product || x.campaign_name || "Campaña")}</h3><span>${escapeHtml(x.offer || "")}</span><small>${new Date(x.updated_at || x.created_at).toLocaleString("es-DO")} · ${escapeHtml(money(x.budget))}</small></article>`,
        )
        .join("")
    : '<div class="empty-list">Todavía no hay campañas guardadas en esta sucursal.</div>';
  $("historyGrid")
    .querySelectorAll("[data-id]")
    .forEach(
      (el) =>
        (el.onclick = () => {
          current = campaigns.find((x) => x.id === el.dataset.id);
          showView("builder");
          renderOutput();
        }),
    );
}
function showView(view) {
  document
    .querySelectorAll(".view")
    .forEach((x) =>
      x.classList.toggle(
        "active",
        x.id === `view${view[0].toUpperCase()}${view.slice(1)}`,
      ),
    );
  document
    .querySelectorAll(".nav-item")
    .forEach((x) => x.classList.toggle("active", x.dataset.view === view));
  $("viewTitle").textContent =
    {
      overview: "Resumen",
      wizard: "Crear campaña",
      templates: "Plantillas",
      creatives: "Creativos y QA",
      builder: "Crear campaña",
      audience: "Banco de clientes",
      calendar: "Calendario y capacidad",
      experiments: "Experimentos",
      analytics: "Medición y ventas",
      history: "Campañas guardadas",
      approvals: "Aprobaciones",
      connections: "Conexiones",
    }[view] || "Centro de Anuncios";
}
function download(content, name, type) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(new Blob([content], { type }));
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("loginError").textContent = "";
  $("loginButton").disabled = true;
  try {
    await signInWithEmailAndPassword(
      auth,
      clean($("email").value),
      $("password").value,
    );
  } catch {
    $("loginError").textContent =
      "Correo o contraseña incorrectos, o la cuenta no tiene acceso activo.";
  } finally {
    $("loginButton").disabled = false;
  }
});
$("logoutButton").onclick = () => signOut(auth);
$("businessSelect").onchange = async () => {
  renderBusinessData();
  await loadCampaigns();
  restoreWizard();
  updateWizard();
};
$("productSelect").onchange = () => {
  const p = products.find((x) => x.id === $("productSelect").value);
  if (p) {
    $("product").value = p.nombre || p.name || "";
    const cents = Number(p.precioCentavos ?? p.priceCents ?? 0);
    if (cents) $("price").value = Math.round(cents / 100);
  }
};
$("campaignForm").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    current = generatePackage();
    saveLocal(current);
    renderOutput();
    toast("Paquete generado. Revísalo antes de guardar.");
  } catch (error) {
    toast(error.message || String(error));
  }
});
$("saveButton").onclick = () =>
  saveCurrent().catch((error) => toast(`No se pudo guardar: ${error.message}`));
$("copyButton").onclick = () =>
  current &&
  navigator.clipboard
    .writeText(resultText(current))
    .then(() => toast("Resumen copiado."))
    .catch(() => toast("No se pudo copiar."));
$("txtButton").onclick = () =>
  current &&
  download(
    resultText(current),
    `${current.id}.txt`,
    "text/plain;charset=utf-8",
  );
$("jsonButton").onclick = () =>
  current &&
  download(
    JSON.stringify(current, null, 2),
    `${current.id}.json`,
    "application/json",
  );
$("resetButton").onclick = () => {
  current = null;
  $("campaignForm").reset();
  $("budget").value = 3000;
  $("days").value = 7;
  $("location").value = "La Romana, República Dominicana";
  $("radius").value = 25;
  $("ageMin").value = 18;
  $("ageMax").value = 55;
  $("output").hidden = true;
  $("outputEmpty").hidden = false;
  $("draftState").textContent = "Sin generar";
  ["saveButton", "copyButton", "txtButton", "jsonButton"].forEach(
    (id) => ($(id).disabled = true),
  );
  $("metaButton").classList.add("disabled");
};
$("creative").onchange = () => {
  $("creativeName").textContent =
    $("creative").files[0]?.name || "Ningún archivo seleccionado";
};
$("studioFile").onchange = async () => {
  const file = $("studioFile").files?.[0];
  releaseStudioSource();
  renderCreativeStudio();
  if (!file) {
    $("studioStatus").textContent = "Selecciona una fotografía autorizada. El archivo se procesa solamente en memoria.";
    return;
  }
  try {
    studioSource = await loadStudioImage(file);
    if (!clean($("studioHeadline").value))
      $("studioHeadline").value = clean($("wizardOffer").value) || clean($("product").value) || "Fotografía profesional D' Carela";
    generateStudioPackage();
  } catch (error) {
    $("studioStatus").textContent = error.message || String(error);
  }
};
$("studioGenerate").onclick = generateStudioPackage;
$("studioManifest").onclick = downloadStudioManifest;
for (const id of ["studioHeadline", "studioCta", "studioFocusX", "studioFocusY"])
  $(id).addEventListener("input", () => { if (studioSource.image) generateStudioPackage(); });
$("clientSearch").oninput = renderAudience;
$("refreshHistory").onclick = () =>
  loadCampaigns().then(() => toast("Campañas actualizadas."));
$("campaignStatusFilter").onchange = renderHistory;
$("creativeAssetForm").addEventListener("input", updateAssetQa);
$("creativeAssetForm").addEventListener("change", updateAssetQa);
$("creativeAssetForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const asset = assetFormValue();
  const qa = updateAssetQa();
  if (qa.blocked) return toast("Corrige los bloqueos de derechos antes de guardar.");
  const row = { id: `asset_${Date.now()}_${randomSuffix()}`, business_id: selectedBusiness(), created_at: new Date().toISOString(), ...asset };
  creativeAssets.unshift(row);
  $("creativeAssetForm").reset();
  updateAssetQa();
  renderCreativeAssets();
  const outcome = await persistOperation("creative_assets", creativeAssets, row);
  await recordAudit({ action: "creative_asset_registered", entity: "saleads_assets", entity_id: row.id, detail: row.name });
  renderCreativeAssets();
  toast(outcome.synced
    ? "Metadatos compartidos con la sucursal; el archivo no salió del equipo."
    : `Guardado solo en este dispositivo: ${outcome.message}`);
});
$("capacityForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const slots = Math.max(0, Math.floor(Number($("capacitySlotsInput").value)));
  const reserved = Math.max(0, Math.floor(Number($("capacityReservedInput").value)));
  if (reserved > slots) return toast("Los reservados no pueden superar los cupos reales.");
  const date = $("capacityDate").value;
  const service = clean($("capacityService").value);
  if (!date || !service) return toast("Completa fecha y servicio.");
  capacityEntries = capacityEntries.filter((x) => !(x.date === date && x.service.toLowerCase() === service.toLowerCase()));
  const row = { id: `capacity_${Date.now()}_${randomSuffix()}`, business_id: selectedBusiness(), date, service, slots, reserved, updated_at: new Date().toISOString() };
  capacityEntries.unshift(row);
  renderCapacity();
  const outcome = await persistOperation("capacity_entries", capacityEntries, row);
  await recordAudit({ action: "capacity_updated", entity: "saleads_capacity", entity_id: `${date}__${service}`, detail: `${reserved} reservado(s) de ${slots} cupo(s)` });
  renderCapacity();
  toast(outcome.synced ? "Capacidad compartida con la sucursal." : `Capacidad guardada en este dispositivo: ${outcome.message}`);
});
$("experimentForm").addEventListener("input", updateExperimentDecision);
$("experimentForm").addEventListener("change", updateExperimentDecision);
$("experimentForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = experimentFormValue();
  if (!input.hypothesis) return toast("La hipótesis es obligatoria.");
  const result = saleAds.evaluateExperiment(input);
  const row = { id: `experiment_${Date.now()}_${randomSuffix()}`, business_id: selectedBusiness(), created_at: new Date().toISOString(), ...input, result };
  experimentRecords.unshift(row);
  renderExperiments();
  const outcome = await persistOperation("experiments", experimentRecords, row);
  await recordAudit({ action: "experiment_recorded", entity: "saleads_experiments", entity_id: row.id, detail: `${row.variable} · ${result.decision}` });
  renderExperiments();
  const base = result.decision === "insufficient_data" ? "Evaluación guardada como señal insuficiente." : "Evaluación direccional guardada.";
  toast(outcome.synced ? `${base} Compartida con la sucursal.` : `${base} ${outcome.message}`);
});
$("attributionForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const stage = $("attributionStage").value;
  const reference = clean($("attributionReference").value);
  const value = Math.max(0, Number($("attributionValue").value) || 0);
  if (stage === "paid" && value <= 0) return toast("Una venta pagada requiere valor confirmado.");
  const row = { id: `event_${Date.now()}_${randomSuffix()}`, business_id: selectedBusiness(), campaign_id: $("attributionCampaign").value, stage, reference, value, created_at: new Date().toISOString(), source: "manual_verified" };
  attributionEvents.unshift(row);
  $("attributionForm").reset();
  renderAnalytics();
  const outcome = await persistOperation("attribution_events", attributionEvents, row);
  await recordAudit({ action: "attribution_event_registered", entity: "saleads_attribution", entity_id: row.id, detail: `${stage}${reference ? ` · ${reference}` : ""}` });
  renderAnalytics();
  toast(outcome.synced
    ? "Evento comercial compartido con la sucursal, sin datos personales."
    : `Evento guardado en este dispositivo: ${outcome.message}`);
});
$("approvalForm").addEventListener("submit", (event) => {
  event.preventDefault();
  registerApproval().catch((error) => toast(error.message || String(error)));
});
document.addEventListener("click", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.hasAttribute("data-sync-retry"))
    loadOperationData().catch((error) => console.warn("operations-retry", error));
  if (target instanceof HTMLElement && target.hasAttribute("data-studio-download"))
    downloadStudioVariant(target.dataset.studioDownload)
      .catch((error) => toast(error.message || String(error)));
});
window.addEventListener("online", () => loadOperationData().catch(() => {}));
window.addEventListener("offline", () =>
  setSyncState("offline", "Sin conexión: los cambios nuevos quedan pendientes en este dispositivo."),
);
window.addEventListener("beforeunload", releaseStudioSource);
document
  .querySelectorAll(".nav-item")
  .forEach((x) => (x.onclick = () => showView(x.dataset.view)));
document
  .querySelectorAll("[data-go-view]")
  .forEach((x) => (x.onclick = () => showView(x.dataset.goView)));
document.querySelectorAll("[data-wizard-step]").forEach((x) => {
  x.onclick = () => { wizardStep = Number(x.dataset.wizardStep); updateWizard(); };
});
$("wizardPrev").onclick = () => { wizardStep = Math.max(0, wizardStep - 1); updateWizard(); };
$("wizardNext").onclick = () => {
  const error = validateWizardStep(wizardStep);
  if (error) return toast(error);
  wizardStep = Math.min(7, wizardStep + 1);
  updateWizard();
};
$("wizardCreateDraft").onclick = () => {
  try { createWizardDraft(); } catch (error) { toast(error.message || String(error)); }
};
$("wizardForm").addEventListener("input", updateWizard);
$("wizardForm").addEventListener("change", updateWizard);

renderTemplateLibrary();
renderCreativeSpecs();
if (!$("wizardDeadline").value) {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  $("wizardDeadline").value = date.toISOString().slice(0, 10);
}
if (!$("capacityDate").value) $("capacityDate").value = new Date().toISOString().slice(0, 10);
updateAssetQa();
updateExperimentDecision();
updateWizard();

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    $("app").hidden = true;
    $("login").hidden = false;
    return;
  }
  try {
    await loadAccess(user);
    $("login").hidden = true;
    $("app").hidden = false;
    await loadBusinessData();
    $("preflightFirebase").textContent = `Activo · ${businesses.length} sucursal(es)`;
    $("preflightFirebase").className = "success-text";
    $("connectionFirebase").textContent = `Activo · ${businesses.length} sucursal(es)`;
    restoreWizard();
    updateWizard();
    showView(SALEADS_UI === "classic" ? "builder" : "overview");
    console.log("DCARELA ADS", BUILD);
  } catch (error) {
    await signOut(auth);
    $("loginError").textContent = error.message || String(error);
  }
});
if ("serviceWorker" in navigator)
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("./sw.js").catch(() => {}),
  );
