import Dexie from 'dexie';

export const dbLocal = new Dexie('VenezuelaSOSLocalDB');

dbLocal.version(4).stores({
  mascotasDrafts: '++id, especie_y_raza, estado, ultima_ubicacion, contacto, created_at',
  mascotasCache: 'id, especie_y_raza, estado, ultima_ubicacion, contacto, foto_principal, created_at',
  personasDrafts: '++id, nombre, edad, descripcion, ultima_ubicacion, contacto, instagram, facebook, created_at',
  personasCache: 'id, nombre_y_edad, descripcion, ultima_ubicacion, contacto, redes_sociales, fotos, created_at',
  mensajesLocal: 'id, persona_id, enviado_por, recibido_por, created_at'
});
