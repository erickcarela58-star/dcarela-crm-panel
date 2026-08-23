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

const BUILD = "2026-08-22-ads-standalone-v1";
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
  current = null;

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
  $("historyBadge").textContent = campaigns.length.toLocaleString("es-DO");
  renderHistory();
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
  const role = clean(member.role).toLowerCase();
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

function renderAudience() {
  const q = clean($("clientSearch").value).toLowerCase(),
    rows = clients
      .filter((x) => x.business_id === selectedBusiness())
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
            balance = Number(x.saldoCentavos ?? x.balanceCentavos ?? 0);
          return `<article class="client-card"><h3>${escapeHtml(name)}</h3><span>${phone ? escapeHtml(phone) : "Sin teléfono"}</span><small>${escapeHtml(x.email || "Sin correo")}</small>${balance > 0 ? `<span class="balance">Saldo: ${escapeHtml(money(balance / 100))}</span>` : ""}</article>`;
        })
        .join("")
    : '<div class="empty-list">No hay clientes para esta búsqueda.</div>';
}
function renderHistory() {
  $("historyGrid").innerHTML = campaigns.length
    ? campaigns
        .map(
          (x) =>
            `<article class="history-card" data-id="${escapeHtml(x.id)}"><h3>${escapeHtml(x.product || x.campaign_name || "Campaña")}</h3><span>${escapeHtml(x.offer || "")}</span><small>${new Date(x.updated_at || x.created_at).toLocaleString("es-DO")} · ${escapeHtml(money(x.budget))}</small></article>`,
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
      builder: "Crear campaña",
      audience: "Banco de clientes",
      history: "Campañas guardadas",
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
$("clientSearch").oninput = renderAudience;
$("refreshHistory").onclick = () =>
  loadCampaigns().then(() => toast("Campañas actualizadas."));
document
  .querySelectorAll(".nav-item")
  .forEach((x) => (x.onclick = () => showView(x.dataset.view)));

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
