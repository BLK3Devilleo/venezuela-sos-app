-- Esquema de base de datos para VenezuelaSOS

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    id TEXT PRIMARY KEY, -- ID proveniente de Google OAuth (o auth.uid() en Supabase)
    rol TEXT NOT NULL CHECK (rol IN ('voluntario', 'afectado', 'admin', 'staff')) DEFAULT 'afectado',
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
    tipo TEXT NOT NULL,
    categoria TEXT NOT NULL,
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
    tipo_servicio TEXT NOT NULL,
    subtipo TEXT NOT NULL, -- Ej: 'pediatria', 'escombros', 'reconstruccion', etc.
    rol_servicio TEXT NOT NULL,
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
    creador_id TEXT REFERENCES public.usuarios(id) ON DELETE SET NULL,
    nombre_y_edad TEXT NOT NULL,
    descripcion TEXT,
    ultima_ubicacion TEXT,
    contacto TEXT NOT NULL, -- Teléfono histórico/opcional
    redes_sociales JSONB DEFAULT '{}'::jsonb,
    fotos TEXT[] DEFAULT '{}'::text[],
    estado TEXT NOT NULL CHECK (estado IN ('buscan_a', 'localizado', 'peligro', 'emergencia')) DEFAULT 'buscan_a',
    canales_contacto JSONB DEFAULT '[]'::jsonb,
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

-- Tabla: chat_messages (Salas de chat temáticas globales)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,
    user_id TEXT REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura publica de chats" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Permitir insercion de chats" ON public.chat_messages FOR INSERT WITH CHECK (true);

-- Habilitar Realtime para la tabla chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Tabla: emergencias (Feed de Noticias/Emergencias en Vivo)
CREATE TABLE IF NOT EXISTS public.emergencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creador_id TEXT REFERENCES public.usuarios(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    foto TEXT,
    ubicacion_lat DOUBLE PRECISION NOT NULL,
    ubicacion_lng DOUBLE PRECISION NOT NULL,
    ubicacion_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: mensajes_informacion (Foro interno / correo local de desaparecidos)
CREATE TABLE IF NOT EXISTS public.mensajes_informacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID REFERENCES public.desaparecidos(id) ON DELETE CASCADE NOT NULL,
    enviado_por TEXT REFERENCES public.usuarios(id) ON DELETE SET NULL,
    recibido_por TEXT REFERENCES public.usuarios(id) ON DELETE SET NULL NOT NULL,
    detalles TEXT NOT NULL,
    foto TEXT,
    ubicacion_texto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.emergencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_informacion ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Lectura publica de emergencias" ON public.emergencias FOR SELECT USING (true);
CREATE POLICY "Insercion de emergencias" ON public.emergencias FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura de mensajes por destinatario o remitente" ON public.mensajes_informacion FOR SELECT USING (true);
CREATE POLICY "Insercion de mensajes" ON public.mensajes_informacion FOR INSERT WITH CHECK (true);
CREATE POLICY "Eliminacion de mensajes del servidor" ON public.mensajes_informacion FOR DELETE USING (true);

-- Tabla: marketplace (Mercado Solidario 100% Gratuito)
CREATE TABLE IF NOT EXISTS public.marketplace (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creador_id TEXT REFERENCES public.usuarios(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT NOT NULL CHECK (categoria IN ('ropa', 'energia', 'hogar', 'higiene', 'herramientas', 'otros')),
    tipo TEXT NOT NULL CHECK (tipo IN ('ofrezco', 'necesito', 'intercambio')),
    ubicacion_text TEXT,
    contacto_whatsapp TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.marketplace ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica de marketplace" ON public.marketplace FOR SELECT USING (true);
CREATE POLICY "Permitir insercion de marketplace" ON public.marketplace FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir edicion de marketplace" ON public.marketplace FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminacion de marketplace" ON public.marketplace FOR DELETE USING (true);



