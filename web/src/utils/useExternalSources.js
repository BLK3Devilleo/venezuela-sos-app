/**
 * useExternalSources.js
 * 
 * Hook centralizado para consumir APIs de plataformas aliadas.
 * Lee datos en tiempo real sin guardarlos en Supabase.
 * Incluye caché en memoria (5 min TTL), normalización y manejo de errores por fuente.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Configuración de fuentes ────────────────────────────────────────────────
export const EXTERNAL_SOURCES = {
  desaparecidos_vzla: {
    key: 'desaparecidos_vzla',
    name: 'Desaparecidos Venezuela',
    shortName: 'Desap. Venezuela',
    url: 'https://www.desaparecidosvenezuela.com',
    color: '#2563eb',
    emoji: '🔵',
    description: 'Plataforma ciudadana de registro de personas desaparecidas',
    apiBase: 'https://www.desaparecidosvenezuela.com',
    fetchFn: fetchDesaparecidosVzla,
  },
  sos_venezuela_2026: {
    key: 'sos_venezuela_2026',
    name: 'SOS Venezuela 2026',
    shortName: 'SOS Venezuela',
    url: 'https://sosvenezuela2026.com',
    color: '#16a34a',
    emoji: '🟢',
    description: 'Red nacional de búsqueda y localización',
    apiBase: 'https://sosvenezuela2026.com',
    fetchFn: fetchSosVenezuela,
  },
};

// ─── Caché en memoria ────────────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const _cache = new Map(); // key → { data, fetchedAt }

function getCached(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    _cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  _cache.set(key, { data, fetchedAt: Date.now() });
}

// ─── Normalización de estados ────────────────────────────────────────────────
function normalizeStatus(raw) {
  if (!raw) return 'missing';
  const s = String(raw).toLowerCase().trim();
  if (['buscado', 'missing', 'seeking_info', 'busco'].includes(s)) return 'missing';
  if (['localizado', 'found_alive', 'a salvo', 'safe', 'encontrado'].includes(s)) return 'found';
  if (['fallecido', 'deceased', 'muerto', 'death'].includes(s)) return 'deceased';
  if (['hospitalizado', 'hospitalized', 'admitted'].includes(s)) return 'hospitalized';
  return 'missing';
}

// ─── Corrección de URLs de fotos ─────────────────────────────────────────────
function fixPhotoUrl(path, baseUrl) {
  if (!path) return null;
  if (path.startsWith('http')) {
    // Detectar URLs rotas del workers.dev (sin slash entre dominio y UUID)
    if (path.includes('workers.dev') && !path.match(/workers\.dev\/.+/)) {
      return null; // URL irrecuperable → usará avatar fallback
    }
    return path;
  }
  // URL relativa → construir URL absoluta
  const base = baseUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

// ─── Fetcher: desaparecidosvenezuela.com ─────────────────────────────────────
async function fetchDesaparecidosVzla({ page = 1, limit = 50, search = '' } = {}) {
  const cacheKey = `desaparecidos_vzla_p${page}_l${limit}_s${search}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  // La API devuelve 20 por defecto, paginamos manualmente
  const url = `https://www.desaparecidosvenezuela.com/api/personas${params.toString() ? '?' + params : ''}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
  });

  if (!res.ok) throw new Error(`desaparecidosvenezuela.com: HTTP ${res.status}`);
  const raw = await res.json();

  const normalized = (Array.isArray(raw) ? raw : []).map((item) => ({
    id: `dv_${item.id}`,
    name: item.nombre || 'Sin nombre',
    age: item.edad ?? null,
    status: normalizeStatus(item.estado),
    zone: item.zona || null,
    photoUrl: fixPhotoUrl(item.fotoUrl, 'https://www.desaparecidosvenezuela.com'),
    lat: item.lat ?? null,
    lng: item.lng ?? null,
    description: item.descripcion || null,
    sourceKey: 'desaparecidos_vzla',
    sourceUrl: `https://www.desaparecidosvenezuela.com`,
    sourcePersonUrl: null, // sin deep link por persona
    originalData: item,
  }));

  setCache(cacheKey, normalized);
  return normalized;
}

// ─── Fetcher: sosvenezuela2026.com ───────────────────────────────────────────
async function fetchSosVenezuela({ page = 1, limit = 50, search = '' } = {}) {
  const cacheKey = `sos_vzla_p${page}_l${limit}_s${search}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const url = `https://sosvenezuela2026.com/api/persons/list?${params}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
  });

  if (!res.ok) throw new Error(`sosvenezuela2026.com: HTTP ${res.status}`);
  const raw = await res.json();

  const normalized = (Array.isArray(raw) ? raw : [])
    .filter((item) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (item.display_name || '').toLowerCase().includes(q) ||
        (item.municipio || '').toLowerCase().includes(q) ||
        (item.parroquia || '').toLowerCase().includes(q)
      );
    })
    .map((item) => ({
      id: `sos_${item.id}`,
      name: item.display_name || 'Sin nombre',
      age: null,
      status: normalizeStatus(item.status),
      zone: [item.municipio, item.parroquia].filter(Boolean).join(' · ') || null,
      photoUrl: fixPhotoUrl(item.photo_path, 'https://sosvenezuela2026.com'),
      lat: null,
      lng: null,
      description: item.hospital_name ? `Hospital: ${item.hospital_name}` : null,
      sourceKey: 'sos_venezuela_2026',
      sourceUrl: 'https://sosvenezuela2026.com',
      sourcePersonUrl: null,
      originalData: item,
    }));

  setCache(cacheKey, normalized);
  return normalized;
}

// ─── Fetcher de estadísticas ─────────────────────────────────────────────────
const _statsCache = new Map();

export async function fetchAllStats() {
  const cached = getCached('__stats__');
  if (cached) return cached;

  const stats = {};

  try {
    const res = await fetch('https://sosvenezuela2026.com/api/persons/stats', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      stats.sos_venezuela_2026 = data; // { missing, found, total }
    }
  } catch (_) {}

  setCache('__stats__', stats);
  return stats;
}

// ─── Hook principal ───────────────────────────────────────────────────────────
/**
 * @param {object} options
 * @param {string[]} options.sources  - Array de claves de fuente (default: todas)
 * @param {number}  options.page      - Página (1-based)
 * @param {number}  options.limit     - Registros por página
 * @param {string}  options.search    - Texto de búsqueda
 * @param {string}  options.status    - Filtro de estado: 'all'|'missing'|'found'|'deceased'
 */
export function useExternalSources({
  sources = Object.keys(EXTERNAL_SOURCES),
  page = 1,
  limit = 50,
  search = '',
  status = 'all',
} = {}) {
  const [data, setData] = useState({}); // sourceKey → array
  const [loading, setLoading] = useState({}); // sourceKey → bool
  const [errors, setErrors] = useState({}); // sourceKey → string|null
  const [stats, setStats] = useState({});
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Inicializar estados de carga
    const initLoading = {};
    sources.forEach((k) => (initLoading[k] = true));
    setLoading(initLoading);

    // Cargar estadísticas
    try {
      const s = await fetchAllStats();
      setStats(s);
    } catch (_) {}

    // Cargar cada fuente en paralelo
    await Promise.all(
      sources.map(async (sourceKey) => {
        const source = EXTERNAL_SOURCES[sourceKey];
        if (!source) return;

        try {
          const result = await source.fetchFn({ page, limit, search });

          if (controller.signal.aborted) return;

          // Filtrar por estado
          const filtered =
            status === 'all'
              ? result
              : result.filter((item) => item.status === status);

          setData((prev) => ({ ...prev, [sourceKey]: filtered }));
          setErrors((prev) => ({ ...prev, [sourceKey]: null }));
        } catch (err) {
          if (controller.signal.aborted) return;
          console.warn(`[ExternalSources] Error cargando ${sourceKey}:`, err.message);
          setErrors((prev) => ({
            ...prev,
            [sourceKey]: `No se pudieron cargar los datos de ${source.name}`,
          }));
          setData((prev) => ({ ...prev, [sourceKey]: [] }));
        } finally {
          if (!controller.signal.aborted) {
            setLoading((prev) => ({ ...prev, [sourceKey]: false }));
          }
        }
      })
    );
  }, [sources.join(','), page, limit, search, status]);

  useEffect(() => {
    load();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [load]);

  // Datos combinados de todas las fuentes
  const allData = sources.flatMap((k) => data[k] || []);
  const isLoading = sources.some((k) => loading[k]);
  const hasError = sources.some((k) => errors[k]);

  return {
    data,           // { sourceKey: [] }
    allData,        // array plano de todos los registros
    loading,        // { sourceKey: bool }
    errors,         // { sourceKey: string|null }
    stats,          // { sos_venezuela_2026: { missing, found, total } }
    isLoading,      // any source loading
    hasError,       // any source has error
    refresh: load,  // función para refrescar manualmente
  };
}
