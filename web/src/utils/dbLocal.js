import Dexie from 'dexie';

export const dbLocal = new Dexie('VenezuelaSOSLocalDB');

// Subimos la versión a 2 para agregar la tabla de caché de datos oficiales
dbLocal.version(2).stores({
  mascotasDrafts: '++id, especie_y_raza, estado, ultima_ubicacion, contacto, created_at',
  mascotasCache: 'id, especie_y_raza, estado, ultima_ubicacion, contacto, foto_principal, created_at'
});
