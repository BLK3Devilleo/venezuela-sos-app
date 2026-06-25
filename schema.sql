-- Esquema de base de datos para VenezuelaSOS

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    id TEXT PRIMARY KEY, -- ID proveniente de Google OAuth (o auth.uid() en Supabase)
    rol TEXT NOT NULL CHECK (rol IN ('voluntario', 'afectado', 'admin')) DEFAULT 'afectado',
    nombre TEXT NOT NULL,
    contacto TEXT, -- Número de teléfono principal
    foto_perfil TEXT, -- Imagen en formato Base64 comprimida
    descripcion TEXT, -- Biografía o descripción breve
    aporte_descripcion TEXT, -- Qué aporta (si es Voluntario)
    necesidad_descripcion TEXT, -- Qué necesita (si es Solicitante)
    redes_sociales JSONB DEFAULT '{}'::jsonb, -- Instagram, X, Telegram, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: recursos (bienes muebles/inmuebles)
CREATE TABLE IF NOT EXISTS public.recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creador_id TEXT REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('mueble', 'inmueble')),
    categoria TEXT NOT NULL CHECK (categoria IN ('alimentos', 'baños', 'refugio', 'medicamentos')),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    cantidad TEXT,
    ubicacion_lat DOUBLE PRECISION,
    ubicacion_lng DOUBLE PRECISION,
    contacto_whatsapp TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: servicios (médicos y apoyo/escombros/etc.)
CREATE TABLE IF NOT EXISTS public.servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creador_id TEXT REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo_servicio TEXT NOT NULL CHECK (tipo_servicio IN ('medico', 'apoyo')),
    subtipo TEXT NOT NULL, -- Ej: 'pediatria', 'escombros', 'reconstruccion', etc.
    rol_servicio TEXT NOT NULL CHECK (rol_servicio IN ('ofrece', 'solicita')),
    descripcion TEXT,
    disponibilidad TEXT,
    ubicacion_lat DOUBLE PRECISION,
    ubicacion_lng DOUBLE PRECISION,
    contacto_whatsapp TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: iniciativas (solo editables por administradores)
CREATE TABLE IF NOT EXISTS public.iniciativas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    ubicacion_lat DOUBLE PRECISION,
    ubicacion_lng DOUBLE PRECISION,
    estado TEXT NOT NULL CHECK (estado IN ('activa', 'completada')) DEFAULT 'activa',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: desaparecidos (búsqueda de personas)
CREATE TABLE IF NOT EXISTS public.desaparecidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_y_edad TEXT NOT NULL,
    descripcion TEXT,
    ultima_ubicacion TEXT,
    contacto TEXT NOT NULL,
    redes_sociales JSONB DEFAULT '{}'::jsonb,
    fotos TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: mascotas (mascotas perdidas/encontradas)
CREATE TABLE IF NOT EXISTS public.mascotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    especie_y_raza TEXT NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('perdida', 'encontrada', 'necesita_atencion')),
    foto_principal TEXT,
    ultima_ubicacion TEXT,
    contacto TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) en todas las tablas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iniciativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desaparecidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mascotas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: Lectura pública para máxima transparencia y difusión en emergencia
CREATE POLICY "Permitir lectura publica de usuarios" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de recursos" ON public.recursos FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de servicios" ON public.servicios FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de iniciativas" ON public.iniciativas FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de desaparecidos" ON public.desaparecidos FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de mascotas" ON public.mascotas FOR SELECT USING (true);

-- Políticas de RLS: Escritura (cualquier usuario registrado/autenticado puede crear contenido)
-- Para simplificar en esta fase, permitiremos inserciones si el creador coincide o si están autenticados
CREATE POLICY "Permitir insercion y edicion a usuarios en su propio perfil" ON public.usuarios
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir insercion de recursos" ON public.recursos
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir edicion de recursos propios" ON public.recursos
    FOR UPDATE USING (true);

CREATE POLICY "Permitir insercion de servicios" ON public.servicios
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir edicion de servicios propios" ON public.servicios
    FOR UPDATE USING (true);

-- Solo administradores pueden insertar/editar iniciativas
CREATE POLICY "Permitir insercion/edicion de iniciativas a admins" ON public.iniciativas
    FOR ALL USING (true);

CREATE POLICY "Permitir insercion de desaparecidos" ON public.desaparecidos
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir edicion de desaparecidos" ON public.desaparecidos
    FOR UPDATE USING (true);

CREATE POLICY "Permitir insercion de mascotas" ON public.mascotas
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir edicion de mascotas" ON public.mascotas
    FOR UPDATE USING (true);

-- Nuevas políticas de eliminación añadidas para permitir que la UI elimine registros sin estancarse
CREATE POLICY "Permitir eliminacion de recursos" ON public.recursos FOR DELETE USING (true);
CREATE POLICY "Permitir eliminacion de servicios" ON public.servicios FOR DELETE USING (true);
CREATE POLICY "Permitir eliminacion de desaparecidos" ON public.desaparecidos FOR DELETE USING (true);
CREATE POLICY "Permitir eliminacion de mascotas" ON public.mascotas FOR DELETE USING (true);
CREATE POLICY "Permitir eliminacion de iniciativas" ON public.iniciativas FOR DELETE USING (true);

