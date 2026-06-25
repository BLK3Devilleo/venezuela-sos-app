import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://mqjjgbynsslthrhwntra.supabase.co';
const supabaseKey = '***SUPABASE_KEY_REMOVED***';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Iniciando carga de datos en Supabase...');

  // 1. Crear un usuario "Sistema" base para asociar recursos/servicios
  const { error: userError } = await supabase
    .from('usuarios')
    .upsert({
      id: 'sistema_seeder',
      rol: 'admin',
      nombre: 'Sistema de Sincronización',
      contacto: '171'
    });

  if (userError) {
    console.error('Error creando usuario seeder:', userError);
  } else {
    console.log('Usuario de sistema creado/actualizado.');
  }

  // 2. Cargar Desaparecidos de desaparecidosterremotovenezuela.json
  try {
    const desaparecidosData = JSON.parse(
      fs.readFileSync(
        path.join('..', 'recursos informativos', 'webs scrappings', 'desaparecidosterremotovenezuela.json'),
        'utf-8'
      )
    );

    const records = desaparecidosData.records_page_1 || [];
    console.log(`Leídos ${records.length} registros de desaparecidos de desaparecidosterremotovenezuela.json`);

    const formattedDesaparecidos = records.map(r => {
      // Si el nombre contiene palabras como "Maya", "Kira", "Trufas", no los metemos aquí (los meteremos en mascotas)
      const nameLower = r.name.toLowerCase();
      const isPet = ['maya', 'trufas', 'rocco', 'kira', 'meleys', 'maia'].some(pet => nameLower.includes(pet));
      if (isPet) return null;

      return {
        nombre_y_edad: r.name + (r.age ? ` (${r.age})` : ''),
        descripcion: `Reportado sin contacto. Última vez visto: ${r.last_seen || 'No especificado'}.`,
        ultima_ubicacion: r.last_seen || 'La Guaira',
        contacto: '171 (Línea de emergencia)',
        redes_sociales: {},
        fotos: []
      };
    }).filter(Boolean);

    if (formattedDesaparecidos.length > 0) {
      const { error: despError } = await supabase
        .from('desaparecidos')
        .insert(formattedDesaparecidos);

      if (despError) console.error('Error insertando desaparecidos:', despError);
      else console.log(`Insertados ${formattedDesaparecidos.length} personas desaparecidas.`);
    }
  } catch (err) {
    console.error('Error procesando desaparecidosterremotovenezuela.json:', err);
  }

  try {
    let tvRaw = fs.readFileSync(
      path.join('..', 'recursos informativos', 'webs scrappings', 'terremotovenezuela.json'),
      'utf-8'
    );
    tvRaw = tvRaw.replace(/\/\*[\s\S]*?\*\//g, ''); // Eliminar comentarios estilo /* ... */
    const tvData = JSON.parse(tvRaw);

    const dest = tvData.personas_desaparecidas_destacadas || [];
    const petsFormatted = [];
    const peopleFormatted = [];

    dest.forEach(d => {
      const nameLower = d.nombre.toLowerCase();
      const isPet = ['maya', 'trufas', 'rocco', 'kira', 'meleys', 'maia'].some(pet => nameLower.includes(pet));

      if (isPet) {
        petsFormatted.push({
          especie_y_raza: `Perro (${d.nombre})`,
          estado: 'perdida',
          ultima_ubicacion: d.ubicacion || 'Desconocido',
          contacto: '171',
          foto_principal: null
        });
      } else {
        peopleFormatted.push({
          nombre_y_edad: d.nombre + (d.edad ? ` (${d.edad} años)` : ''),
          descripcion: `Búsqueda activa: ${d.tipo}. Sector: ${d.ubicacion || 'Desconocido'}.`,
          ultima_ubicacion: d.ubicacion || 'Desconocido',
          contacto: '171',
          redes_sociales: {},
          fotos: []
        });
      }
    });

    if (petsFormatted.length > 0) {
      const { error: petError } = await supabase
        .from('mascotas')
        .insert(petsFormatted);
      if (petError) console.error('Error insertando mascotas:', petError);
      else console.log(`Insertadas ${petsFormatted.length} mascotas perdidas.`);
    }

    if (peopleFormatted.length > 0) {
      const { error: pepError } = await supabase
        .from('desaparecidos')
        .insert(peopleFormatted);
      if (pepError) console.error('Error insertando personas destacadas:', pepError);
      else console.log(`Insertadas ${peopleFormatted.length} personas destacadas.`);
    }

    // 4. Insertar algunos reportes del mapa como Recursos o Servicios
    const mapReports = tvData.reportes_en_mapa_listado || [];
    const resourcesToInsert = [];
    const servicesToInsert = [];

    mapReports.forEach(r => {
      // Mapear colores e iconos a recursos o servicios
      if (r.tipo_icono_color === 'rojo') {
        // Crítico / Emergencia / Necesita ayuda -> Servicio solicitado
        servicesToInsert.push({
          creador_id: 'sistema_seeder',
          tipo_servicio: 'apoyo',
          subtipo: 'escombros_y_rescate',
          rol_servicio: 'solicita',
          descripcion: `${r.titulo}: ${r.descripcion}. Afectados: ${r.personas_afectadas}. Hace: ${r.hace}`,
          disponibilidad: 'Urgente',
          ubicacion_lat: 10.6018 + (Math.random() - 0.5) * 0.05, // Coordenadas aproximadas por La Guaira
          ubicacion_lng: -66.9322 + (Math.random() - 0.5) * 0.05,
          contacto_whatsapp: '584120000000'
        });
      } else if (r.tipo_icono_color === 'morado') {
        // Púrpura es búsqueda de persona, se ignora aquí porque ya los cargamos en desaparecidos
      } else {
        // Otros colores se asumen como recursos ofrecidos/solicitados
        resourcesToInsert.push({
          creador_id: 'sistema_seeder',
          tipo: 'mueble',
          categoria: r.tipo_icono_color === 'amarillo' ? 'medicamentos' : 'alimentos',
          nombre: r.titulo || 'Suministros',
          descripcion: `${r.descripcion || 'Punto de recolección de ayuda.'} Hace: ${r.hace}`,
          cantidad: `${r.personas_afectadas || 1} kits/bultos`,
          ubicacion_lat: 10.5000 + (Math.random() - 0.5) * 0.08, // Alrededores de Caracas
          ubicacion_lng: -66.9000 + (Math.random() - 0.5) * 0.08,
          contacto_whatsapp: '584120000000'
        });
      }
    });

    // Añadir algunos recursos predefinidos como puntos de refugio y baños para que se vean en el mapa
    resourcesToInsert.push(
      {
        creador_id: 'sistema_seeder',
        tipo: 'inmueble',
        categoria: 'refugio',
        nombre: 'Gimnasio Cubierto José María Vargas',
        descripcion: 'Refugio comunitario temporal activo. Capacidad para 300 personas. Hay carpas montadas en el área deportiva.',
        cantidad: 'Disponible',
        ubicacion_lat: 10.6050,
        ubicacion_lng: -66.9350,
        contacto_whatsapp: '584129998877'
      },
      {
        creador_id: 'sistema_seeder',
        tipo: 'inmueble',
        categoria: 'baños',
        nombre: 'Gimnasio Fitness Center - Duchas Habilitadas',
        descripcion: 'Prestamos servicios de duchas y aseo personal por turnos de 15 minutos. Traer toalla propia.',
        cantidad: '10 duchas activas',
        ubicacion_lat: 10.6010,
        ubicacion_lng: -66.9290,
        contacto_whatsapp: '584125554433'
      },
      {
        creador_id: 'sistema_seeder',
        tipo: 'mueble',
        categoria: 'alimentos',
        nombre: 'Comedor Comunitario - Plaza Bolívar de Catia la Mar',
        descripcion: 'Repartición de sopa caliente y pan a las familias afectadas. Organizado por voluntarios civiles.',
        cantidad: 'Almuerzos diarios',
        ubicacion_lat: 10.6030,
        ubicacion_lng: -66.9720,
        contacto_whatsapp: '584241112233'
      }
    );

    if (servicesToInsert.length > 0) {
      const { error: servError } = await supabase
        .from('servicios')
        .insert(servicesToInsert);
      if (servError) console.error('Error insertando servicios:', servError);
      else console.log(`Insertados ${servicesToInsert.length} servicios.`);
    }

    if (resourcesToInsert.length > 0) {
      const { error: resError } = await supabase
        .from('recursos')
        .insert(resourcesToInsert);
      if (resError) console.error('Error insertando recursos:', resError);
      else console.log(`Insertados ${resourcesToInsert.length} recursos.`);
    }

  } catch (err) {
    console.error('Error procesando terremotovenezuela.json:', err);
  }

  console.log('Seeding finalizado con éxito.');
}

seed();
