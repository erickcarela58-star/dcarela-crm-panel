/* Cola de Estados: archivos locales duraderos, orden de envío e idempotencia.
 * El servidor decide la audiencia. Un acuse de cola nunca equivale a un envío.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DcarelaEstadosCola = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX = 50;
  const espera = r => !!(r?.red || r?.tiempo || r?.incompleta || r?.retryable || r?.status >= 500 || r?.status === 429
    || ['estado_cola_llena', 'estado_pendiente', 'bridge_disconnected', 'bridge_paused', 'bridge_host_offline', 'bridge_host_stale', 'bridge_reconnect_only'].includes(r?.code));

  function almacen(scope) {
    const prefix = scope + '|';
    function tx(mode, work) {
      return new Promise((resolve, reject) => {
        const open = indexedDB.open('dcarela-estados-cola', 1);
        open.onupgradeneeded = () => open.result.createObjectStore('jobs', { keyPath: 'key' });
        open.onerror = () => reject(open.error || Error('No se pudo guardar la cola de estados'));
        open.onsuccess = () => {
          const db = open.result;
          try {
            const t = db.transaction('jobs', mode), st = t.objectStore('jobs');
            let value;
            work(st, result => { value = result; });
            t.oncomplete = () => { db.close(); resolve(value); };
            t.onabort = t.onerror = () => { db.close(); reject(t.error || Error('No hay espacio para guardar los estados')); };
          } catch (e) { db.close(); reject(e); }
        };
      });
    }
    return {
      all: () => tx('readonly', (st, done) => {
        const q = st.getAll(IDBKeyRange.bound(prefix, prefix + '\uffff'));
        q.onsuccess = () => done(q.result.map(({ key, ...job }) => job));
      }),
      put: jobs => tx('readwrite', st => { for (const job of jobs) st.put({ ...job, key: prefix + job.id }); }),
      del: id => tx('readwrite', st => st.delete(prefix + id)),
    };
  }

  function crear({ store, preparar, publicar, consultar, cambio = () => {}, resultado = () => {}, vigente = () => true,
    bloqueo = fn => fn(), ahora = () => Date.now() }) {
    let jobs = [], ready = null, worker = null, polling = null;
    const sinGuardar = new Set();
    const avisar = () => { try { cambio(jobs.slice()); } catch (_) { /* el dibujo no cancela un envío */ } };
    const recibido = (job, row) => { try { resultado(job, row); } catch (_) { /* acuse independiente del dibujo */ } };
    const guardar = async job => {
      try { await store.put([job]); sinGuardar.delete(job.id); }
      catch(e) { sinGuardar.add(job.id); throw e; }
    };
    const init = () => ready || (ready = store.all().then(rows => {
      jobs = rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
      for (const j of jobs) if (j.phase === 'uploading') j.phase = 'queued';
      avisar(); return jobs;
    }).catch(e => { ready = null; throw e; }));
    async function add(items) {
      await init();
      if (jobs.length + items.length > MAX) throw Error('Hay un máximo de 50 estados en cola. Espera a que salgan algunos.');
      const nuevos = items.map(j => ({ ...j, phase: 'queued', error: '', retry_at: 0 }));
      await store.put(nuevos); // Todos o ninguno: la falta de espacio conserva el compositor.
      jobs.push(...nuevos); avisar();
      return nuevos;
    }
    async function run() {
      await init();
      if (worker || !vigente()) return worker;
      worker = Promise.resolve().then(() => bloqueo(async () => {
        // El bloqueo impide dos publicadores simultáneos, pero otra pestaña pudo
        // terminar esta tanda mientras esperábamos. Releer el almacén DENTRO del
        // bloqueo evita subir y preparar otra vez una foto ya aceptada.
        const anteriores = new Set(jobs.map(j=>j.id));
        const filas = await store.all();
        const memoria = jobs.filter(j => sinGuardar.has(j.id) || !anteriores.has(j.id));
        jobs = [...new Map([...filas, ...memoria].map(j=>[j.id,j])).values()]
          .sort((a,b)=>a.created_at.localeCompare(b.created_at));
        for (const j of jobs) if (j.phase === 'uploading' && !sinGuardar.has(j.id)) j.phase = 'queued';
        avisar();
        for (const job of jobs) {
          if (!vigente()) break;
          if (job.phase === 'accepted' || job.phase === 'failed') continue;
          if (job.retry_at > ahora()) break;
          try {
            if (ahora() - Date.parse(job.created_at) > 6 * 3600000) throw Error('Este estado caducó sin enviarse. Revísalo antes de volver a subirlo.');
            if (!job.prepared) {
              job.phase = 'uploading'; job.error = ''; await guardar(job); avisar();
              const preparado = await preparar(job, texto => { job.progress = texto; avisar(); });
              if (!preparado.ok) throw preparado;
              job.prepared = preparado.cuerpo;
              job.thumb = preparado.thumb || '';
              await guardar(job); // Una respuesta perdida se reintenta con la MISMA solicitud.
            }
            if (!vigente()) break;
            const r = await publicar(job.prepared, job);
            if (!r.ok) throw r;
            if (!r.data?.id) throw { red: true, error: 'El servidor no confirmó la cola todavía' };
            job.server_id = r.data.id; job.server_status = r.data.status || 'pending';
            job.total = r.data.total ?? job.total;
            job.phase = 'accepted'; job.blob = null; job.progress = ''; job.error = '';
            try { await guardar(job); } catch (_) { /* El acuse en memoria prevalece sobre la copia antigua del disco. */ }
            recibido(job, { id: job.server_id, status: job.server_status }); avisar();
          } catch (e) {
            job.error = String(e?.error || e?.message || e || 'No se pudo enviar el estado'); job.progress = '';
            const transitorio = espera(e) || e?.abortado || !vigente();
            job.phase = transitorio ? 'waiting' : 'failed';
            job.retry_at = transitorio ? ahora() + 10000 : 0;
            try { await guardar(job); } catch (_) { /* conservar también en memoria */ }
            avisar();
            if (transitorio) break; // No adelantar a una foto que espera conexión.
          }
        }
      })).finally(() => { worker = null; });
      return worker;
    }
    async function sync() {
      await init();
      if (polling || !vigente()) return polling;
      const ids = jobs.filter(j => j.phase === 'accepted').map(j => j.server_id);
      if (!ids.length) return;
      polling = Promise.resolve().then(async () => {
        const r = await consultar(ids);
        if (!r.ok || !vigente()) return;
        for (const row of r.data || []) {
          const job = jobs.find(j => j.server_id === row.id);
          if (!job) continue;
          job.server_status = row.status;
          recibido(job, row);
          if (['sent', 'published', 'failed', 'expired'].includes(row.status) || row.deleted_at) {
            await store.del(job.id); sinGuardar.delete(job.id); jobs = jobs.filter(j => j !== job);
          }
        }
        avisar();
      }).finally(() => { polling = null; });
      return polling;
    }
    async function retry(id) {
      const j = jobs.find(j => j.id === id && j.phase === 'failed' && !j.server_id);
      if (!j) return;
      j.phase = 'queued'; j.error = ''; j.retry_at = 0; await guardar(j); avisar();
      return run();
    }
    async function remove(id) {
      if (worker) throw Error('Espera a que termine la subida actual.');
      const j = jobs.find(j => j.id === id && !j.server_id);
      if (!j) return;
      await store.del(id); jobs = jobs.filter(j => j !== id); avisar();
    }
    return { init, add, run, sync, retry, remove, snapshot: () => jobs.slice() };
  }
  return { MAX, crear, almacen, espera };
});
