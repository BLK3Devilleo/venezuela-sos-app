import Dexie from 'dexie';

export const dbLocal = new Dexie('VenezuelaSOSLocalDB');

// Subimos la versión a 3 para agregar las tablas de personas desaparecidas
dbLocal.version(3).stores({
  mascotasDrafts: '++id, especie_y_raza, estado, ultima_ubicacion, contacto, created_at',
  mascotasCache: 'id, especie_y_raza, estado, ultima_ubicacion, contacto, foto_principal, created_at',
  personasDrafts: '++id, nombre, edad, descripcion, ultima_ubicacion, contacto, instagram, facebook, created_at',
  personasCache: 'id, nombre_y_edad, descripcion, ultima_ubicacion, contacto, redes_sociales, fotos, created_at'
});
