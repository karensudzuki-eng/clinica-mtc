-- ==============================================================================
-- SISTEMA DE GESTIÓN CLÍNICA: MEDICINA TRADICIONAL CHINA Y AURICULOTERAPIA
-- Esquema dedicado para Supabase (PostgreSQL)
-- Nombre del esquema: clinica_mtc
-- ==============================================================================

-- 1. CREACIÓN DEL ESQUEMA DEDICADO
CREATE SCHEMA IF NOT EXISTS clinica_mtc;

-- Habilitar extensión para UUIDs en PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar search_path para las consultas de este script
SET search_path TO clinica_mtc, public;

-- ==============================================================================
-- 2. TABLA: PACIENTES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS clinica_mtc.pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo VARCHAR(255) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(255),
    fecha_nacimiento DATE,
    ocupacion VARCHAR(150),
    antecedentes_medicos JSONB DEFAULT '{}'::jsonb, -- Cirugías, patologías base, alergias
    medicamentos JSONB DEFAULT '[]'::jsonb,          -- Fármacos actuales, dosis
    habitos JSONB DEFAULT '{}'::jsonb,               -- Sueño, digestión, apetito, sed, emociones, actividad física
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('UTC', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('UTC', NOW()) NOT NULL
);

-- Índices de búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_pacientes_rut ON clinica_mtc.pacientes(rut);
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre ON clinica_mtc.pacientes USING gin(to_tsvector('spanish', nombre_completo));

-- ==============================================================================
-- 3. TABLA: ANAMNESIS (INGRESO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS clinica_mtc.anamnesis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES clinica_mtc.pacientes(id) ON DELETE CASCADE,
    motivo_consulta TEXT NOT NULL,
    tiempo_dolencia VARCHAR(100),
    diagnostico_occidental TEXT,
    -- Diagnóstico de Lengua MTC
    lengua_cuerpo VARCHAR(100),   -- Normal, Pálida, Roja, Hinchada, Delgada, Marcas dentales, Fisuras
    lengua_color VARCHAR(100),    -- Pálida, Rosada, Roja, Roja Oscura, Violácea/Amoratada
    lengua_saburra VARCHAR(100),  -- Blanca fina, Blanca gruesa, Amarilla gruesa, Pelada/Geográfica, Grasa
    -- Diagnóstico Sindromático MTC
    elementos_5 JSONB DEFAULT '[]'::jsonb,            -- Madera, Fuego, Tierra, Metal, Agua
    sindromes_bagang JSONB DEFAULT '{}'::jsonb,       -- Yin/Yang, Frío/Calor, Interior/Exterior, Vacío/Plenitud
    organos_comprometidos JSONB DEFAULT '[]'::jsonb,  -- Zang-Fu: Hígado, Corazón, Bazo, Pulmón, Riñón, etc.
    meridianos_comprometidos JSONB DEFAULT '[]'::jsonb, -- Canales principales/secundarios
    -- Tratamiento Inicial
    espiritu_tratamiento TEXT,                         -- Principio terapéutico (Tonificar Qi, Disipar Humedad, etc.)
    puntos_auriculoterapia_inicial JSONB DEFAULT '[]'::jsonb, -- Puntos auriculares seleccionados y materiales
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('UTC', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_anamnesis_paciente_id ON clinica_mtc.anamnesis(paciente_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_created_at ON clinica_mtc.anamnesis(created_at DESC);

-- ==============================================================================
-- 4. TABLA: SEGUIMIENTOS (SESIONES POSTERIORES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS clinica_mtc.seguimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES clinica_mtc.pacientes(id) ON DELETE CASCADE,
    numero_tratamiento INT NOT NULL DEFAULT 2,
    evolucion_general TEXT NOT NULL,
    cambios_sintomas TEXT,
    -- Estado de Lengua en el Seguimiento
    lengua_cuerpo_actual VARCHAR(100),
    lengua_color_actual VARCHAR(100),
    lengua_saburra_actual VARCHAR(100),
    -- Puntos de Auriculoterapia aplicados en la sesión
    -- Estructura: [{"zona": "Concha Cava", "punto": "Corazón", "material": "Semillas de Vaccaria", "lateralidad": "Bilateral"}]
    puntos_auriculoterapia JSONB DEFAULT '[]'::jsonb,
    tecnicas_especiales TEXT, -- Moxibustión, Ventosas, Electroacupuntura, etc.
    observaciones_terapeuta TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('UTC', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_seguimientos_paciente_id ON clinica_mtc.seguimientos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_seguimientos_numero ON clinica_mtc.seguimientos(paciente_id, numero_tratamiento);

-- ==============================================================================
-- 5. TABLA: MULTIMEDIA CLÍNICA (EVOLUCIÓN FOTOGRÁFICA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS clinica_mtc.multimedia_clinica (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES clinica_mtc.pacientes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'lengua_ingreso', 'oreja_ingreso', 'lengua_seguimiento', 'oreja_seguimiento'
    url_archivo TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- Ej: {"sesion": 1, "observaciones": "Punta de lengua roja"}
    fecha_registro DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('UTC', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_multimedia_paciente ON clinica_mtc.multimedia_clinica(paciente_id);
CREATE INDEX IF NOT EXISTS idx_multimedia_tipo ON clinica_mtc.multimedia_clinica(tipo);

-- ==============================================================================
-- 6. TRIGGER PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ==============================================================================
CREATE OR REPLACE FUNCTION clinica_mtc.actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('UTC', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pacientes_updated_at ON clinica_mtc.pacientes;
CREATE TRIGGER trigger_pacientes_updated_at
BEFORE UPDATE ON clinica_mtc.pacientes
FOR EACH ROW EXECUTE FUNCTION clinica_mtc.actualizar_timestamp();

-- ==============================================================================
-- 7. PERMISOS Y SEGURIDAD (RLS) PARA SUPABASE API
-- ==============================================================================
-- Dar permisos de uso del esquema a los roles de Supabase
GRANT USAGE ON SCHEMA clinica_mtc TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA clinica_mtc TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA clinica_mtc TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA clinica_mtc TO anon, authenticated, service_role;

-- Configurar permisos por defecto para futuras tablas del esquema
ALTER DEFAULT PRIVILEGES IN SCHEMA clinica_mtc GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA clinica_mtc GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA clinica_mtc GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Habilitar Row Level Security (RLS) en todas las tablas
ALTER TABLE clinica_mtc.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinica_mtc.anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinica_mtc.seguimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinica_mtc.multimedia_clinica ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso permisivas para entorno clínico (Anon / Autenticado)
-- Permite lectura y escritura desde la aplicación web
DROP POLICY IF EXISTS "Acceso total pacientes anon/auth" ON clinica_mtc.pacientes;
CREATE POLICY "Acceso total pacientes anon/auth" 
ON clinica_mtc.pacientes FOR ALL 
TO anon, authenticated 
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total anamnesis anon/auth" ON clinica_mtc.anamnesis;
CREATE POLICY "Acceso total anamnesis anon/auth" 
ON clinica_mtc.anamnesis FOR ALL 
TO anon, authenticated 
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total seguimientos anon/auth" ON clinica_mtc.seguimientos;
CREATE POLICY "Acceso total seguimientos anon/auth" 
ON clinica_mtc.seguimientos FOR ALL 
TO anon, authenticated 
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total multimedia anon/auth" ON clinica_mtc.multimedia_clinica;
CREATE POLICY "Acceso total multimedia anon/auth" 
ON clinica_mtc.multimedia_clinica FOR ALL 
TO anon, authenticated 
USING (true) WITH CHECK (true);

-- ==============================================================================
-- 8. DATOS SEMILLA (PACIENTES DE PRUEBA PARA DEMOSTRACIÓN CLÍNICA INICIAL)
-- ==============================================================================
INSERT INTO clinica_mtc.pacientes (id, nombre_completo, rut, telefono, email, fecha_nacimiento, ocupacion, antecedentes_medicos, medicamentos, habitos)
VALUES 
(
    'a1111111-1111-1111-1111-111111111111',
    'María Elena Valenzuela Lagos',
    '14.589.231-K',
    '+56 9 8765 4321',
    'm.valenzuela@ejemplo.cl',
    '1982-05-14',
    'Contadora Auditora',
    '{"alergias": "Ninguna declarada", "cirugias": "Apendicectomía (2010)", "patologias": "Gastritis nerviosa, Insomnio de conciliación"}',
    '["Omeprazol 20mg en ayunas", "Melatonina 3mg noche"]',
    '{"sueno": "Despierta entre 1:00 y 3:00 am (Horario Hígado)", "digestion": "Distensión abdominal vespertina", "emociones": "Irritabilidad y estrés laboral acumulado", "sed": "Boca amarga por las mañanas"}'
),
(
    'b2222222-2222-2222-2222-222222222222',
    'Carlos Alberto Soto Mardones',
    '12.345.678-9',
    '+56 9 9123 4567',
    'carlos.soto@ejemplo.cl',
    '1975-11-20',
    'Ingeniero en Construcción',
    '{"alergias": "Penicilina", "cirugias": "Meniscos rodilla derecha (2018)", "patologias": "Hipertensión leve controlada, Lumbalgia crónica"}',
    '["Losartán 50mg"]',
    '{"sueno": "Sueño no reparador", "digestion": "Lenta con alimentos fríos", "emociones": "Ansiedad por plazos", "ejercicio": "Sedentario"}'
)
ON CONFLICT (rut) DO NOTHING;

-- Anamnesis de María Elena
INSERT INTO clinica_mtc.anamnesis (
    id, paciente_id, motivo_consulta, tiempo_dolencia, diagnostico_occidental,
    lengua_cuerpo, lengua_color, lengua_saburra,
    elementos_5, sindromes_bagang, organos_comprometidos, meridianos_comprometidos,
    espiritu_tratamiento, puntos_auriculoterapia_inicial
)
VALUES (
    'c3333333-3333-3333-3333-333333333333',
    'a1111111-1111-1111-1111-111111111111',
    'Cefaleas pulsátiles temporales, dolor cervical agudo, opresión torácica e irritabilidad marcada.',
    '8 meses con recrudecimiento en las últimas 3 semanas',
    'Cefalea tensional crónica / Síndrome ansioso-depresivo leve',
    'Bordes levantados y marcas dentales en bordes laterales',
    'Roja con bordes especialmente rojos',
    'Blanca fina con zonas ligeramente amarillentas en zona central',
    '["Madera (Hígado)", "Fuego (Corazón)"]',
    '{"polaridad": "Yang", "localizacion": "Interior con afectación de superficie", "temperatura": "Calor", "fuerza": "Plenitud de Yang de Hígado con Vacío de Sangre"}',
    '["Hígado (Gan)", "Vesícula Biliar (Dan)", "Bazo (Pi)"]',
    '["Meridiano de Vesícula Biliar (Zu Shao Yang)", "Meridiano de Hígado (Zu Jue Yin)"]',
    'Pacificar el Yang hepático, drenar el Fuego de Hígado, nutrir la Sangre y calmar el Shen (espíritu).',
    '[
        {"zona": "Fosa Triangular", "punto": "Shen Men", "material": "Semillas de Vaccaria", "lateralidad": "Bilateral"},
        {"zona": "Concha Cava", "punto": "Hígado", "material": "Semillas de Vaccaria", "lateralidad": "Bilateral"},
        {"zona": "Antitrago", "punto": "Subcórtex (Cerebro)", "material": "Balines Magnéticos", "lateralidad": "Derecho"},
        {"zona": "Concha Cava", "punto": "Punto Cero", "material": "Semillas de Vaccaria", "lateralidad": "Bilateral"}
    ]'
)
ON CONFLICT (id) DO NOTHING;

-- Seguimiento 2 de María Elena
INSERT INTO clinica_mtc.seguimientos (
    id, paciente_id, numero_tratamiento, evolucion_general, cambios_sintomas,
    lengua_cuerpo_actual, lengua_color_actual, lengua_saburra_actual,
    puntos_auriculoterapia, tecnicas_especiales, observaciones_terapeuta
)
VALUES (
    'd4444444-4444-4444-4444-444444444444',
    'a1111111-1111-1111-1111-111111111111',
    2,
    'Notable mejoría en la frecuencia de cefaleas (disminuyeron en un 60%). Paciente refiere haber descansado mejor las últimas 4 noches.',
    'Tensión cervical aún presente pero de menor intensidad (EVA 4/10 vs EVA 8/10 inicial). Desaparición de sensación de boca amarga matutina.',
    'Bordes menos tensos, leve impronta dental restante',
    'Rosada con punta ligeramente roja (Shen calmado)',
    'Blanca fina y regular',
    '[
        {"zona": "Fosa Triangular", "punto": "Shen Men", "material": "Semillas de Vaccaria", "lateralidad": "Bilateral"},
        {"zona": "Cruz del Hélix", "punto": "Punto Cero", "material": "Semillas de Vaccaria", "lateralidad": "Bilateral"},
        {"zona": "Concha Cava", "punto": "Corazón / Shen", "material": "Balines Dorados", "lateralidad": "Izquierdo"},
        {"zona": "Lóbulo", "punto": "Relajación Muscular / Cuello", "material": "Chinchetas Intradérmicas", "lateralidad": "Derecho"}
    ]',
    'Aplicación de ventosas fijas en puntos Shu de Espalda (V18 Ganshu y V23 Shenshu) durante 10 minutos.',
    'Se instruye a la paciente a presionar suavemente las semillas de Shen Men 3 veces al día durante 30 segundos.'
)
ON CONFLICT (id) DO NOTHING;

-- Registro de imágenes iniciales
INSERT INTO clinica_mtc.multimedia_clinica (
    id, paciente_id, tipo, url_archivo, metadata, fecha_registro
)
VALUES 
(
    'e5555555-5555-5555-5555-555555555551',
    'a1111111-1111-1111-1111-111111111111',
    'lengua_ingreso',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
    '{"descripcion": "Lengua Sesión 1: Bordes marcadamente enrojecidos, tensión hepática visible, saburra amarilla en zona central"}',
    '2026-10-15'
),
(
    'e5555555-5555-5555-5555-555555555552',
    'a1111111-1111-1111-1111-111111111111',
    'oreja_ingreso',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80',
    '{"descripcion": "Oreja Sesión 1: Reactividad dolorosa alta en zona Concha Cava (Hígado) y Fosa Triangular"}',
    '2026-10-15'
),
(
    'e5555555-5555-5555-5555-555555555553',
    'a1111111-1111-1111-1111-111111111111',
    'lengua_seguimiento',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
    '{"descripcion": "Lengua Sesión 2: Descenso notable de la hiperemia en bordes, cuerpo más relajado y saburra normal"}',
    '2026-11-02'
),
(
    'e5555555-5555-5555-5555-555555555554',
    'a1111111-1111-1111-1111-111111111111',
    'oreja_seguimiento',
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
    '{"descripcion": "Oreja Sesión 2: Aplicación bilateral de semillas de Vaccaria en Shen Men y Punto Cero"}',
    '2026-11-02'
)
ON CONFLICT (id) DO NOTHING;
