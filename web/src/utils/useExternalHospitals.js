import { useState, useEffect, useCallback } from 'react';

const SUPABASE_URL = "https://ozuxfepfkvnxkywdsqxy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dXhmZXBma3ZueGt5d2RzcXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MjI5NTEsImV4cCI6MjA5Nzk5ODk1MX0.YhW0GalGkQZdO2NJTg_01C5XhdMmJ6RbNSNXXC0xG4o";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
const cache = {
  data: null,
  timestamp: null
};

export function useExternalHospitals() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && cache.data && cache.timestamp && Date.now() - cache.timestamp < CACHE_TTL_MS) {
      setData(cache.data);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/hospitales?select=id,nombre,tipo,estado,ciudad,telefono,lat,lng,estado_operativo,capacidad,nota,confirmaciones,ultima_actualizacion,verificado,personal_salud&activo=eq.true`, {
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": "Bearer " + SUPABASE_ANON_KEY,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error('No se pudieron cargar los hospitales');
      }

      const json = await response.json();
      
      // Sort by open first, then name
      const PRIO = { abierto: 0, saturado: 1, desconocido: 2, cerrado: 3 };
      json.sort((a, b) => {
        const pa = PRIO[a.estado_operativo] ?? 2;
        const pb = PRIO[b.estado_operativo] ?? 2;
        if (pa !== pb) return pa - pb;
        return (a.nombre || '').localeCompare(b.nombre || '', 'es');
      });

      cache.data = json;
      cache.timestamp = Date.now();
      setData(json);
    } catch (err) {
      console.error("Error fetching hospitals:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: () => fetchData(true) };
}
