/**
 * ==============================================================================
 * CLIENTE SUPABASE - CLÍNICA MTC Y AURICULOTERAPIA
 * Conexión segura y modular al esquema dedicado 'clinica_mtc'
 * ==============================================================================
 */

// Configuración por defecto y claves de almacenamiento local
const STORAGE_KEY_CONFIG = 'clinica_mtc_supabase_cfg';
const STORAGE_KEY_LOCAL_DB = 'clinica_mtc_local_db_v1';
const DEDICATED_SCHEMA = 'clinica_mtc';

// Estado global de conexión
let supabaseClient = null;
let currentConfig = {
    url: 'https://onnlfkbnenskmckwpovap.supabase.co',
    anonKey: '',
    schema: DEDICATED_SCHEMA
};

// Datos Semilla Locales (Fallback y Demo interactiva inmediata)
const DEFAULT_MOCK_DATA = {
    pacientes: [
        {
            id: 'a1111111-1111-1111-1111-111111111111',
            nombre_completo: 'María Elena Valenzuela Lagos',
            rut: '14.589.231-K',
            telefono: '+56 9 8765 4321',
            email: 'm.valenzuela@ejemplo.cl',
            fecha_nacimiento: '1982-05-14',
            ocupacion: 'Contadora Auditora',
            antecedentes_medicos: {
                alergias: 'Ninguna declarada',
                cirugias: 'Apendicectomía (2010)',
                patologias: 'Gastritis nerviosa, Insomnio de conciliación'
            },
            medicamentos: ['Omeprazol 20mg en ayunas', 'Melatonina 3mg noche'],
            habitos: {
                sueno: 'Despierta entre 1:00 y 3:00 am (Horario Hígado)',
                digestion: 'Distensión abdominal vespertina',
                emociones: 'Irritabilidad y estrés laboral acumulado',
                sed: 'Boca amarga por las mañanas'
            },
            created_at: '2026-10-15T14:30:00Z'
        },
        {
            id: 'b2222222-2222-2222-2222-222222222222',
            nombre_completo: 'Carlos Alberto Soto Mardones',
            rut: '12.345.678-9',
            telefono: '+56 9 9123 4567',
            email: 'carlos.soto@ejemplo.cl',
            fecha_nacimiento: '1975-11-20',
            ocupacion: 'Ingeniero en Construcción',
            antecedentes_medicos: {
                alergias: 'Penicilina',
                cirugias: 'Meniscos rodilla derecha (2018)',
                patologias: 'Hipertensión leve controlada, Lumbalgia crónica'
            },
            medicamentos: ['Losartán 50mg'],
            habitos: {
                sueno: 'Sueño no reparador por tensión lumbar',
                digestion: 'Lenta con alimentos fríos',
                emociones: 'Ansiedad por plazos laborales',
                ejercicio: 'Sedentario'
            },
            created_at: '2026-10-20T10:00:00Z'
        }
    ],
    anamnesis: [
        {
            id: 'c3333333-3333-3333-3333-333333333333',
            paciente_id: 'a1111111-1111-1111-1111-111111111111',
            motivo_consulta: 'Cefaleas pulsátiles temporales recurrentes, rigidez cervical aguda, opresión en hipocondrios e insomnio.',
            tiempo_dolencia: '8 meses, agudizado en las últimas 3 semanas',
            diagnostico_occidental: 'Cefalea tensional crónica / Trastorno de ansiedad adaptativo',
            lengua_cuerpo: 'Bordes tensos y marcas dentales laterales',
            lengua_color: 'Roja en bordes laterales y punta',
            lengua_saburra: 'Blanca fina central con zonas secas',
            elementos_5: ['Madera (Hígado/Vesícula Biliar)', 'Fuego (Corazón)'],
            sindromes_bagang: {
                polaridad: 'Yang',
                localizacion: 'Interior con afección de canales',
                temperatura: 'Calor en Hígado',
                fuerza: 'Plenitud de Yang Hepático y Estancamiento de Qi'
            },
            organos_comprometidos: ['Hígado (Gan)', 'Vesícula Biliar (Dan)', 'Bazo (Pi)'],
            meridianos_comprometidos: ['Meridiano Zu Shao Yang (Vesícula Biliar)', 'Meridiano Zu Jue Yin (Hígado)'],
            espiritu_tratamiento: 'Pacificar el Yang hepático, movilizar el Qi estancado, calmar el Shen y desbloquear canales auriculares.',
            puntos_auriculoterapia_inicial: [
                { zona: 'Fosa Triangular', punto: 'Shen Men', material: 'Semillas de Vaccaria', lateralidad: 'Bilateral' },
                { zona: 'Concha Cava', punto: 'Hígado', material: 'Semillas de Vaccaria', lateralidad: 'Bilateral' },
                { zona: 'Antitrago', punto: 'Subcórtex (Cerebro)', material: 'Balines Magnéticos', lateralidad: 'Derecho' },
                { zona: 'Cruz del Hélix', punto: 'Punto Cero', material: 'Semillas de Vaccaria', lateralidad: 'Bilateral' }
            ],
            created_at: '2026-10-15T15:00:00Z'
        }
    ],
    seguimientos: [
        {
            id: 'd4444444-4444-4444-4444-444444444444',
            paciente_id: 'a1111111-1111-1111-1111-111111111111',
            numero_tratamiento: 2,
            evolucion_general: 'Disminución del 60% en la intensidad y frecuencia de cefaleas. Paciente relata dormir 6 horas continuas.',
            cambios_sintomas: 'Desaparición de sabor amargo en la boca. Persiste leve contractura en trapecio derecho (EVA 3/10).',
            lengua_cuerpo_actual: 'Cuerpo menos contraído, impronta dental atenuada',
            lengua_color_actual: 'Rosada con leve eritema en punta',
            lengua_saburra_actual: 'Blanca normal y regular',
            puntos_auriculoterapia: [
                { zona: 'Fosa Triangular', punto: 'Shen Men', material: 'Semillas de Vaccaria', lateralidad: 'Bilateral' },
                { zona: 'Cruz del Hélix', punto: 'Punto Cero', material: 'Semillas de Vaccaria', lateralidad: 'Bilateral' },
                { zona: 'Concha Cava', punto: 'Corazón / Shen', material: 'Balines Dorados', lateralidad: 'Izquierdo' },
                { zona: 'Lóbulo', punto: 'Relajación Cuello / Cervical', material: 'Chinchetas Intradérmicas', lateralidad: 'Derecho' }
            ],
            tecnicas_especiales: 'Ventosas fijas en puntos Shu de Espalda (V18 Ganshu y V23 Shenshu) durante 10 minutos.',
            observaciones_terapeuta: 'Paciente muy receptiva. Se refuerza digitopresión en Shen Men.',
            created_at: '2026-11-02T16:00:00Z'
        }
    ],
    multimedia_clinica: [
        {
            id: 'e5555555-5555-5555-5555-555555555551',
            paciente_id: 'a1111111-1111-1111-1111-111111111111',
            tipo: 'lengua_ingreso',
            url_archivo: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
            metadata: { notas: 'Ingreso: Bordes marcadamente rojos, rigidez lateral por estancamiento de Qi de Hígado.' },
            fecha_registro: '2026-10-15',
            created_at: '2026-10-15T15:15:00Z'
        },
        {
            id: 'e5555555-5555-5555-5555-555555555552',
            paciente_id: 'a1111111-1111-1111-1111-111111111111',
            tipo: 'oreja_ingreso',
            url_archivo: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80',
            metadata: { notas: 'Ingreso: Puntos reactivos de alta sensibilidad en Shen Men y zona Hígado.' },
            fecha_registro: '2026-10-15',
            created_at: '2026-10-15T15:20:00Z'
        },
        {
            id: 'e5555555-5555-5555-5555-555555555553',
            paciente_id: 'a1111111-1111-1111-1111-111111111111',
            tipo: 'lengua_seguimiento',
            url_archivo: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
            metadata: { notas: 'Seguimiento Sesión 2: Descenso de la hiperemia marginal, cuerpo más flexible.' },
            fecha_registro: '2026-11-02',
            created_at: '2026-11-02T16:15:00Z'
        },
        {
            id: 'e5555555-5555-5555-5555-555555555554',
            paciente_id: 'a1111111-1111-1111-1111-111111111111',
            tipo: 'oreja_seguimiento',
            url_archivo: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
            metadata: { notas: 'Seguimiento Sesión 2: Aplicación con semillas de Vaccaria en Shen Men y Punto Cero.' },
            fecha_registro: '2026-11-02',
            created_at: '2026-11-02T16:20:00Z'
        }
    ]
};

// ==============================================================================
// GESTIÓN DE ALMACENAMIENTO LOCAL (FALLBACK Y PERSISTENCIA OFFLINE)
// ==============================================================================
function getLocalDB() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_LOCAL_DB);
        if (!raw) {
            localStorage.setItem(STORAGE_KEY_LOCAL_DB, JSON.stringify(DEFAULT_MOCK_DATA));
            return JSON.parse(JSON.stringify(DEFAULT_MOCK_DATA));
        }
        return JSON.parse(raw);
    } catch (e) {
        console.warn('Error leyendo localDB, usando memoria temporal:', e);
        return DEFAULT_MOCK_DATA;
    }
}

function saveLocalDB(db) {
    try {
        localStorage.setItem(STORAGE_KEY_LOCAL_DB, JSON.stringify(db));
    } catch (e) {
        console.error('Error guardando en localDB:', e);
    }
}

// ==============================================================================
// INICIALIZACIÓN DEL CLIENTE SUPABASE
// ==============================================================================
function initSupabase() {
    // Intentar leer de variables globales o localStorage
    const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (savedConfig) {
        try {
            const parsed = JSON.parse(savedConfig);
            currentConfig.url = parsed.url || '';
            currentConfig.anonKey = parsed.anonKey || '';
            currentConfig.schema = parsed.schema || DEDICATED_SCHEMA;
        } catch (e) {
            console.warn('Error parseando configuración guardada:', e);
        }
    }

    // Verificar si window.ENV_SUPABASE_URL está presente (inyectado por Vercel/HTML)
    if (!currentConfig.url && window.ENV_SUPABASE_URL) {
        currentConfig.url = window.ENV_SUPABASE_URL;
        currentConfig.anonKey = window.ENV_SUPABASE_ANON_KEY || '';
    }

    // Si tenemos URL y Llave y el SDK de Supabase está en window.supabase
    if (currentConfig.url && currentConfig.anonKey && window.supabase && window.supabase.createClient) {
        try {
            supabaseClient = window.supabase.createClient(currentConfig.url, currentConfig.anonKey, {
                db: {
                    schema: currentConfig.schema || DEDICATED_SCHEMA
                },
                auth: {
                    persistSession: true,
                    autoRefreshToken: true
                }
            });
            console.log(`[Supabase] Conectado exitosamente al esquema: ${currentConfig.schema}`);
            return true;
        } catch (err) {
            console.error('[Supabase] Error al inicializar cliente:', err);
            supabaseClient = null;
            return false;
        }
    }

    return false;
}

// Inicializar al cargar
initSupabase();

// ==============================================================================
// API DEL REPOSITORIO CLÍNICO
// ==============================================================================
window.ClinicaAPI = {
    // Obtener estado y configuración actual
    getConfig() {
        return {
            ...currentConfig,
            isConnected: !!supabaseClient
        };
    },

    // Guardar nueva configuración de Supabase desde la interfaz
    saveConfig(url, anonKey, schema = DEDICATED_SCHEMA) {
        currentConfig.url = (url || '').trim();
        currentConfig.anonKey = (anonKey || '').trim();
        currentConfig.schema = (schema || DEDICATED_SCHEMA).trim();
        
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(currentConfig));
        const success = initSupabase();
        return success;
    },

    // Probar conectividad real con Supabase
    async testConnection() {
        if (!supabaseClient) {
            return { ok: false, message: 'Cliente no configurado. Operando en modo local.' };
        }
        try {
            const { data, error } = await supabaseClient
                .schema(currentConfig.schema)
                .from('pacientes')
                .select('count', { count: 'exact', head: true });
            
            if (error) throw error;
            return { ok: true, message: `Conexión exitosa al esquema '${currentConfig.schema}'.` };
        } catch (err) {
            return { ok: false, message: err.message || 'Fallo de conexión con Supabase.' };
        }
    },

    // --------------------------------------------------------------------------
    // MÓDULO: PACIENTES
    // --------------------------------------------------------------------------
    pacientes: {
        async listar() {
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .schema(currentConfig.schema)
                        .from('pacientes')
                        .select('*')
                        .order('created_at', { ascending: false });
                    if (!error && data) return data;
                    console.warn('[Supabase Fallback] Usando datos locales para listar pacientes:', error);
                } catch (e) {
                    console.warn('[Supabase Error] Usando datos locales:', e);
                }
            }
            const db = getLocalDB();
            return [...db.pacientes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        },

        async buscar(termino) {
            const term = (termino || '').trim().toLowerCase();
            if (!term) return this.listar();

            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .schema(currentConfig.schema)
                        .from('pacientes')
                        .select('*')
                        .or(`nombre_completo.ilike.%${term}%,rut.ilike.%${term}%`)
                        .order('created_at', { ascending: false });
                    if (!error && data) return data;
                } catch (e) {
                    console.warn('[Supabase Error] Fallback en búsqueda:', e);
                }
            }

            const db = getLocalDB();
            return db.pacientes.filter(p => 
                (p.nombre_completo && p.nombre_completo.toLowerCase().includes(term)) ||
                (p.rut && p.rut.toLowerCase().includes(term))
            );
        },

        async obtenerPorId(id) {
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .schema(currentConfig.schema)
                        .from('pacientes')
                        .select('*')
                        .eq('id', id)
                        .single();
                    if (!error && data) return data;
                } catch (e) {
                    console.warn('[Supabase Error] Fallback al obtener por ID:', e);
                }
            }
            const db = getLocalDB();
            return db.pacientes.find(p => p.id === id) || null;
        },

        async crear(nuevoPaciente) {
            const record = {
                id: crypto.randomUUID ? crypto.randomUUID() : 'pac_' + Date.now(),
                nombre_completo: nuevoPaciente.nombre_completo,
                rut: nuevoPaciente.rut,
                telefono: nuevoPaciente.telefono || '',
                email: nuevoPaciente.email || '',
                fecha_nacimiento: nuevoPaciente.fecha_nacimiento || null,
                ocupacion: nuevoPaciente.ocupacion || '',
                antecedentes_medicos: nuevoPaciente.antecedentes_medicos || {},
                medicamentos: nuevoPaciente.medicamentos || [],
                habitos: nuevoPaciente.habitos || {},
                created_at: new Date().toISOString()
            };

            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .schema(currentConfig.schema)
                        .from('pacientes')
                        .insert([record])
                        .select()
                        .single();
                    if (!error && data) {
                        // Sincronizar también en copia local
                        const db = getLocalDB();
                        db.pacientes.unshift(data);
                        saveLocalDB(db);
                        return data;
                    }
                    console.warn('[Supabase Insert Error]:', error);
                } catch (e) {
                    console.error('[Supabase Insert Exception]:', e);
                }
            }

            // Persistir localmente
            const db = getLocalDB();
            db.pacientes.unshift(record);
            saveLocalDB(db);
            return record;
        }
    },

    // --------------------------------------------------------------------------
    // MÓDULO: ANAMNESIS (INGRESO)
    // --------------------------------------------------------------------------
    anamnesis: {
        async obtenerPorPaciente(pacienteId) {
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .schema(currentConfig.schema)
                        .from('anamnesis')
                        .select('*')
                        .eq('paciente_id', pacienteId)
                        .order('created_at', { ascending: false });
                    if (!error && data) return data;
                } catch (e) {
                    console.warn('[Supabase Error] Fallback en anamnesis:', e);
                }
            }
            const db = getLocalDB();
            return db.anamnesis.filter(a => a.paciente_id === pacienteId);
        },

        async crear(datos) {
            const record = {
                id: crypto.randomUUID ? crypto.randomUUID() : 'ana_' + Date.now(),
                paciente_id: datos.paciente_id,
                motivo_consulta: datos.motivo_consulta,
                tiempo_dolencia: datos.tiempo_dolencia || '',
                diagnostico_occidental: datos.diagnostico_occidental || '',
                lengua_cuerpo: datos.lengua_cuerpo || '',
                lengua_color: datos.lengua_color || '',
                lengua_saburra: datos.lengua_saburra || '',
                elementos_5: datos.elementos_5 || [],
                sindromes_bagang: datos.sindromes_bagang || {},
                organos_comprometidos: datos.organos_comprometidos || [],
                meridianos_comprometidos: datos.meridianos_comprometidos || [],
                espiritu_tratamiento: datos.espiritu_tratamiento || '',
                puntos_auriculoterapia_inicial: datos.puntos_auriculoterapia_inicial || [],
                created_at: new Date().toISOString()
            };

            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .schema(currentConfig.schema)
                        .from('anamnesis')
                        .insert([record])
                        .select()
                        .single();
                    if (!error && data) {
                        const db = getLocalDB();
                        db.anamnesis.unshift(data);
                        saveLocalDB(db);
                        return data;
                    }
                } catch (e) {
                    console.warn('[Supabase Insert Error en anamnesis]:', e);
                }
            }

            const db = getLocalDB();
            db.anamnesis.unshift(record);
            saveLocalDB(db);
            return record;
        }
    },

    // --------------------------------------------------------------------------
    // MÓDULO: SEGUIMIENTOS (SESIONES POSTERIORES)
    // --------------------------------------------------------------------------
    seguimientos: {
        async obtenerPorPaciente(pacienteId) {
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .schema(currentConfig.schema)
                        .from('seguimientos')
                        .select('*')
                        .eq('paciente_id', pacienteId)
                        .order('numero_tratamiento', { ascending: true });
                    if (!error && data) return data;
                } catch (e) {
                    console.warn('[Supabase Error] Fallback en seguimientos:', e);
                }
            }
            const db = getLocalDB();
            return db.seguimientos
                .filter(s => s.paciente_id === pacienteId)
                .sort((a, b) => a.numero_tratamiento - b.numero_tratamiento);
        },

        async crear(datos) {
            const record = {
                id: crypto.randomUUID ? crypto.randomUUID() : 'seg_' + Date.now(),
                paciente_id: datos.paciente_id,
                numero_tratamiento: Number(datos.numero_tratamiento) || 2,
                evolucion_general: datos.evolucion_general,
                cambios_sintomas: datos.cambios_sintomas || '',
                lengua_cuerpo_actual: datos.lengua_cuerpo_actual || '',
                lengua_color_actual: datos.lengua_color_actual || '',
                lengua_saburra_actual: datos.lengua_saburra_actual || '',
                puntos_auriculoterapia: datos.puntos_auriculoterapia || [],
                tecnicas_especiales: datos.tecnicas_especiales || '',
                observaciones_terapeuta: datos.observaciones_terapeuta || '',
                created_at: new Date().toISOString()
            };

            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .schema(currentConfig.schema)
                        .from('seguimientos')
                        .insert([record])
                        .select()
                        .single();
                    if (!error && data) {
                        const db = getLocalDB();
                        db.seguimientos.push(data);
                        saveLocalDB(db);
                        return data;
                    }
                } catch (e) {
                    console.warn('[Supabase Insert Error en seguimientos]:', e);
                }
            }

            const db = getLocalDB();
            db.seguimientos.push(record);
            saveLocalDB(db);
            return record;
        }
    },

    // --------------------------------------------------------------------------
    // MÓDULO: MULTIMEDIA CLÍNICA (EVOLUCIÓN FOTOGRÁFICA)
    // --------------------------------------------------------------------------
    multimedia: {
        async obtenerPorPaciente(pacienteId) {
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .schema(currentConfig.schema)
                        .from('multimedia_clinica')
                        .select('*')
                        .eq('paciente_id', pacienteId)
                        .order('created_at', { ascending: true });
                    if (!error && data) return data;
                } catch (e) {
                    console.warn('[Supabase Error] Fallback en multimedia:', e);
                }
            }
            const db = getLocalDB();
            return db.multimedia_clinica.filter(m => m.paciente_id === pacienteId);
        },

        async registrar(datos) {
            const record = {
                id: crypto.randomUUID ? crypto.randomUUID() : 'med_' + Date.now(),
                paciente_id: datos.paciente_id,
                tipo: datos.tipo, // 'lengua_ingreso', 'oreja_ingreso', 'lengua_seguimiento', 'oreja_seguimiento'
                url_archivo: datos.url_archivo,
                metadata: datos.metadata || {},
                fecha_registro: datos.fecha_registro || new Date().toISOString().split('T')[0],
                created_at: new Date().toISOString()
            };

            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient
                        .schema(currentConfig.schema)
                        .from('multimedia_clinica')
                        .insert([record])
                        .select()
                        .single();
                    if (!error && data) {
                        const db = getLocalDB();
                        db.multimedia_clinica.push(data);
                        saveLocalDB(db);
                        return data;
                    }
                } catch (e) {
                    console.warn('[Supabase Insert Error en multimedia]:', e);
                }
            }

            const db = getLocalDB();
            db.multimedia_clinica.push(record);
            saveLocalDB(db);
            return record;
        }
    },

    // Restablecer base de datos local a datos semilla de demostración
    resetDemoData() {
        localStorage.setItem(STORAGE_KEY_LOCAL_DB, JSON.stringify(DEFAULT_MOCK_DATA));
        return DEFAULT_MOCK_DATA;
    }
};
