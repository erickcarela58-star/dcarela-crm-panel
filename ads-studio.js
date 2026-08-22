(function () {
  'use strict';

  const PRESETS = {
    xv: { label:'XV años', audience:'Madres y jóvenes de 14 a 17 años en La Romana', hook:'Haz que sus XV se sientan tan únicos como ella', benefit:'una experiencia guiada y recuerdos con acabado profesional' },
    infantil: { label:'Infantil', audience:'Familias con niños de 1 a 10 años en La Romana', hook:'Su infancia cambia rápido; este momento merece quedarse', benefit:'una sesión divertida, cómoda y pensada para su edad' },
    cumpleanos: { label:'Cumpleaños', audience:'Personas que celebrarán cumpleaños en los próximos 60 días', hook:'Tu cumpleaños merece más que fotos improvisadas', benefit:'retratos que celebran tu estilo y tu nueva etapa' },
    graduacion: { label:'Graduación', audience:'Estudiantes y familias en temporada de graduación', hook:'Todo el esfuerzo de estos años cabe en una imagen inolvidable', benefit:'retratos de graduación listos para compartir y conservar' },
    embarazadas: { label:'Embarazadas', audience:'Futuras madres y parejas en La Romana', hook:'Esta espera pasa una vez; conviértela en un recuerdo para siempre', benefit:'una sesión delicada, dirigida y adaptada a tu comodidad' },
    boda: { label:'Bodas', audience:'Parejas comprometidas y personas planificando boda en República Dominicana', hook:'Tu historia merece fotografías que vuelvan a emocionarte', benefit:'cobertura con dirección, detalles y momentos reales' },
    familiar: { label:'Familiar', audience:'Familias de La Romana y zonas cercanas', hook:'Reúnanse hoy para recordar siempre cómo se sienten juntos', benefit:'una sesión cálida y guiada para toda la familia' },
    corporativo: { label:'Corporativo', audience:'Emprendedores, profesionales y negocios de La Romana', hook:'Tu imagen también comunica la calidad de tu trabajo', benefit:'fotografías profesionales coherentes con tu marca' }
  };
  const STORE = 'dcarela_ads_studio_v1';
  let current = null;
  let creativeUrl = '';
  const $ = id => document.getElementById(id);
  const clean = value => String(value || '').trim();
  const money = value => new Intl.NumberFormat('es-DO',{style:'currency',currency:'DOP',maximumFractionDigits:0}).format(Number(value)||0);
  const safeFile = value => clean(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60) || 'campana';
  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function readHistory() { try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (_) { return []; } }
  function writeHistory(items) { localStorage.setItem(STORE, JSON.stringify(items.slice(0,20))); }
  function values() {
    return {
      category:$('adsCategory').value, objective:$('adsObjective').value,
      funnel:$('adsFunnel').value, format:$('adsFormat').value,
      product:clean($('adsProduct').value), price:Number($('adsPrice').value)||0,
      cta:$('adsCta').value,
      offer:clean($('adsOffer').value), budget:Number($('adsBudget').value)||0,
      days:Math.max(1,Number($('adsDays').value)||1), destination:$('adsDestination').value,
      audience:clean($('adsAudience').value), tone:$('adsTone').value,
      location:clean($('adsLocation').value), radius:Number($('adsRadius').value)||25,
      age_min:Number($('adsAgeMin').value)||18, age_max:Number($('adsAgeMax').value)||65,
      placements:$('adsPlacements').value, proof:clean($('adsProof').value), urgency:clean($('adsUrgency').value),
      start:clean($('adsStart').value), notes:clean($('adsNotes').value),
      creativeName:clean($('adsCreative').files[0]?.name || '')
    };
  }
  function destinationUrls(category) {
    const cfg = window.CRM_CONFIG || window.DCARELA_CRM_CONFIG || {};
    const categoryMap = {xv:'xv',infantil:'infantil',cumpleanos:'cumpleanos',graduacion:'graduacion',embarazadas:'embarazadas',boda:'boda'};
    const cat = categoryMap[category] || category;
    const webBase = cfg.publicCatalogUrl || 'https://dcarelacompufoto.com/combos.html';
    const web = new URL(webBase, location.href);
    web.searchParams.set('cat', cat);
    web.searchParams.set('utm_source','meta'); web.searchParams.set('utm_medium','paid_social'); web.searchParams.set('utm_campaign',`dcarela_${category}`);
    const phone = String(cfg.businessNumber || '18495245620').replace(/\D/g,'');
    const msg = `Hola, vi el anuncio de ${PRESETS[category].label} y quiero información para reservar.`;
    return { web:web.href, whatsapp:`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, message:msg };
  }
  function generate() {
    const form = values(); const preset = PRESETS[form.category];
    if (!form.product) { $('adsProduct').focus(); alert('Escribe el producto o servicio que quieres vender.'); return; }
    if (!form.offer) { $('adsOffer').focus(); alert('Escribe la oferta o el beneficio principal.'); return; }
    if (!form.budget || form.budget < 1) { $('adsBudget').focus(); alert('Indica un presupuesto mayor que cero.'); return; }
    if (form.age_min > form.age_max) { $('adsAgeMin').focus(); alert('La edad mínima no puede superar la máxima.'); return; }
    const urls = destinationUrls(form.category);
    const daily = form.budget / form.days;
    const audience = form.audience || preset.audience;
    const objectiveLabel = $('adsObjective').selectedOptions[0].textContent;
    const toneLead = form.tone === 'emocional' ? 'Imagina volver a sentir este momento cada vez que mires tus fotos.' : form.tone === 'directo' ? 'Reserva tu sesión profesional en La Romana.' : 'Creamos una experiencia cuidada para que disfrutes cada parte de tu sesión.';
    const priceLine = form.price ? ` Desde ${money(form.price)}.` : '';
    const proofLine = form.proof ? ` ${form.proof}.` : '';
    const urgencyLine = form.urgency ? ` ${form.urgency}.` : ' Cupos sujetos a disponibilidad.';
    const funnelPlan = {
      cold:'Presentar la experiencia y generar confianza antes de vender.',
      warm:'Mostrar beneficios, prueba social y resolver la objeción principal.',
      hot:'Oferta clara, disponibilidad y llamado directo a reservar.',
      remarketing:'Recordar el interés previo y facilitar que retome la conversación.',
      loyalty:'Invitar a regresar con una ocasión nueva o beneficio para clientes.'
    }[form.funnel];
    const copies = [
      `${preset.hook}. ${toneLead}\n\n${form.product}: ${form.offer}.${priceLine}${proofLine}\n\nEscríbenos para ver disponibilidad y elegir el combo ideal.${urgencyLine}`,
      `${form.offer}. ✨${priceLine}\n\nEn D'Carela te guiamos antes y durante ${form.product.toLowerCase()} para que el resultado se sienta auténtico.${proofLine}${urgencyLine} Solicita fechas disponibles hoy.`,
      `¿Buscas ${form.product.toLowerCase()} en La Romana? ${preset.hook}.\n\n${form.offer}.${priceLine} Toca el botón y recibe los detalles sin compromiso.${urgencyLine}`
    ];
    current = {
      schema:'dcarela.ads.package.v1', id:`ads-${Date.now()}`, created_at:new Date().toISOString(),
      status:'draft_review_required', ...form, category_label:preset.label, objective_label:objectiveLabel,
      campaign_name:`DCARELA | ${preset.label} | ${objectiveLabel} | ${form.start || new Date().toISOString().slice(0,10)}`,
      adset_name:`${form.location} ${form.radius}km | ${form.age_min}-${form.age_max} | ${money(daily)}/día`, audience, daily_budget:daily,
      destinations:urls, copy_variants:copies,
      headline:`${preset.label}: ${form.cta === 'book_now' ? 'reserva ahora' : 'conoce los combos'}`, description:`${form.offer}${form.price?` · Desde ${money(form.price)}`:''}`,
      creative_brief:`Usar una imagen real, nítida y autorizada de ${preset.label.toLowerCase()}. Mantener el sujeto como protagonista, poco texto en imagen y colores coherentes con D'Carela.`,
      sales_plan:{funnel_strategy:funnelPlan, placements:form.placements, format:form.format, cta:form.cta, ab_test:`Probar Copy 1 contra Copy 3 con el mismo creativo durante al menos 3 días; conservar la variante con menor costo por ${form.objective === 'messages' ? 'conversación iniciada' : form.objective === 'leads' ? 'prospecto' : 'visita de calidad'}.`, follow_up:'Responder rápido, confirmar categoría/fecha y conducir a selección de combo, separación y agenda.'},
      checklist:['Confirmar que el creativo tiene autorización de uso','Revisar ortografía, precio, vigencia y disponibilidad','Verificar que WhatsApp usa el número oficial del bot','Probar el enlace web y sus parámetros UTM','Confirmar presupuesto, fechas y método de pago en Meta','Publicar solo después de aprobación humana']
    };
    const history = readHistory().filter(x => x.id !== current.id); history.unshift(current); writeHistory(history);
    renderOutput(); renderHistory();
    try { window.fbq && window.fbq('trackCustom','AdsPackageGenerated',{category:form.category,objective:form.objective}); } catch (_) {}
  }
  function copyText(text, button) {
    navigator.clipboard.writeText(text).then(()=>{ const old=button.textContent; button.textContent='Copiado'; setTimeout(()=>button.textContent=old,1200); }).catch(()=>alert('No se pudo copiar automáticamente. Usa el paquete TXT.'));
  }
  function card(title, text, detail) {
    return `<article class="ads-card"><h4>${escapeHtml(title)}</h4><p>${escapeHtml(text)}</p>${detail?`<small>${escapeHtml(detail)}</small>`:''}<div class="ads-card-actions"><button class="ads-btn" type="button" data-ads-copy="${escapeHtml(text)}">Copiar</button></div></article>`;
  }
  function renderOutput() {
    const root=$('adsOutput'); if(!root) return;
    if(!current){root.innerHTML='<div class="ads-empty"><div><b>Aquí aparecerá el paquete de campaña</b><br>Completa la oferta y el presupuesto; el estudio generará nombres, audiencia, copys, destinos y checklist.</div></div>';return;}
    root.innerHTML=`<div class="ads-summary"><div><span>Presupuesto diario</span><b>${escapeHtml(money(current.daily_budget))}</b></div><div><span>Duración</span><b>${current.days} días</b></div><div><span>Estado</span><b>Borrador para revisar</b></div></div>${card('Campaña',current.campaign_name,current.adset_name)}${card('Plan de venta',current.sales_plan.funnel_strategy,`Formato: ${current.sales_plan.format} · Ubicaciones: ${current.sales_plan.placements}`)}${current.copy_variants.map((x,i)=>card(`Copy ${i+1}`,x, i===0?'Variante emocional y completa':i===1?'Variante de oferta':'Variante directa')).join('')}${card('Titular',current.headline,current.description)}${card('Prueba A/B',current.sales_plan.ab_test,current.sales_plan.follow_up)}${card('Destino web',current.destinations.web,'Incluye parámetros UTM para atribución')}${card('Destino WhatsApp',current.destinations.whatsapp,current.destinations.message)}${card('Brief creativo',current.creative_brief,current.notes)}<article class="ads-card"><h4>Checklist previo a publicar</h4><pre>${current.checklist.map(x=>'□ '+x).join('\n')}</pre></article>`;
    root.querySelectorAll('[data-ads-copy]').forEach(btn=>btn.onclick=()=>copyText(btn.dataset.adsCopy,btn));
    $('adsExportJson').disabled=false; $('adsExportTxt').disabled=false; $('adsOpenMeta').disabled=false;
  }
  function packageText(item) {
    return [`PAQUETE DE ANUNCIO D'CARELA`,`Estado: BORRADOR — REQUIERE REVISIÓN`,`Campaña: ${item.campaign_name}`,`Conjunto: ${item.adset_name}`,`Producto: ${item.product}`,`Presupuesto: ${money(item.budget)} total · ${money(item.daily_budget)}/día · ${item.days} días`,`Audiencia: ${item.audience}`,`Ubicación: ${item.location} · ${item.radius} km · edades ${item.age_min}-${item.age_max}`,`Plan de venta: ${item.sales_plan.funnel_strategy}`,`Prueba A/B: ${item.sales_plan.ab_test}`,`Seguimiento: ${item.sales_plan.follow_up}`,``,...item.copy_variants.flatMap((x,i)=>[`COPY ${i+1}`,x,``]),`TITULAR`,item.headline,`DESCRIPCIÓN`,item.description,``,`WEB`,item.destinations.web,``,`WHATSAPP`,item.destinations.whatsapp,``,`BRIEF`,item.creative_brief,``,`CHECKLIST`,...item.checklist.map(x=>`[ ] ${x}`)].join('\n');
  }
  function download(content,name,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  function renderHistory(){const root=$('adsHistory');if(!root)return;const items=readHistory();root.innerHTML=items.length?items.slice(0,8).map(x=>`<button type="button" data-ads-history="${escapeHtml(x.id)}"><b>${escapeHtml(x.category_label)} · ${escapeHtml(x.objective_label)}</b><span>${new Date(x.created_at).toLocaleDateString('es-DO')}</span></button>`).join(''):'<div class="ads-note">Los borradores se guardan de forma privada en este navegador. Exporta el paquete para respaldarlo o compartirlo.</div>';root.querySelectorAll('[data-ads-history]').forEach(btn=>btn.onclick=()=>{current=items.find(x=>x.id===btn.dataset.adsHistory)||null;renderOutput()})}
  function wire(){
    const category=$('adsCategory'); if(!category)return;
    category.onchange=()=>{$('adsAudience').placeholder=PRESETS[category.value].audience};
    $('adsGenerate').onclick=generate;
    $('adsCreative').onchange=e=>{if(creativeUrl)URL.revokeObjectURL(creativeUrl);const file=e.target.files[0];const box=$('adsCreativePreview');if(!file){creativeUrl='';box.textContent='Sin creativo';return}creativeUrl=URL.createObjectURL(file);box.innerHTML=`<img src="${creativeUrl}" alt="Vista previa del creativo">`};
    $('adsExportJson').onclick=()=>current&&download(JSON.stringify(current,null,2),`${safeFile(current.campaign_name)}.json`,'application/json');
    $('adsExportTxt').onclick=()=>current&&download(packageText(current),`${safeFile(current.campaign_name)}.txt`,'text/plain;charset=utf-8');
    $('adsOpenMeta').onclick=()=>{if(!current)return;window.open('https://business.facebook.com/adsmanager/manage/campaigns','_blank','noopener')};
    renderOutput();renderHistory();category.dispatchEvent(new Event('change'));
  }
  window.DcarelaAdsStudio={wire,generate,readHistory};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();
})();
