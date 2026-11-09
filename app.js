/**
 * ==============================================================================
 * APLICACIÓN CLÍNICA MTC & AURICULOTERAPIA - CONTROLADOR PRINCIPAL
 * ==============================================================================
 */

const ClinicaState = {
    pacientes: [],
    pacienteSeleccionadoId: null,
    vistaActual: 'search',
    modoComparador: 'side-by-side',
    sliderPosition: 50,
    puntosIngresoTemp: [],
    puntosSeguimientoTemp: []
};

document.addEventListener('DOMContentLoaded', async () => {
    setupNavigation();
    setupCloudModal();
    setupSearchModule();
    setupAnamnesisModule();
    setupSeguimientoModule();
    setupAIModule();
    setupPhotosModule();

    actualizarIndicadorConexion();
    await cargarPacientes();

    if (ClinicaState.pacientes.length > 0) {
        seleccionarPaciente(ClinicaState.pacientes[0].id);
    }
});

function setupNavigation() {
    const tabs = ['search', 'anamnesis', 'seguimiento', 'ai', 'photos'];
    tabs.forEach(tabId => {
        const btn = document.getElementById(`btn-${tabId}`);
        if (btn) {
            btn.addEventListener('click', () => switchTab(tabId));
        }
    });

    agregarPuntoIngreso('Fosa Triangular', 'Shen Men', 'Semillas de Vaccaria', 'Bilateral');
    agregarPuntoSeguimiento('Fosa Triangular', 'Shen Men', 'Semillas de Vaccaria', 'Bilateral');
}

function switchTab(tabId) {
    const tabs = ['search', 'anamnesis', 'seguimiento', 'ai', 'photos'];
    ClinicaState.vistaActual = tabId;

    tabs.forEach(t => {
        const view = document.getElementById(`tab-${t}`);
        const btn = document.getElementById(`btn-${t}`);
        if (view) view.classList.add('hidden');
        if (btn) {
            btn.classList.remove('bg-blue-900', 'text-white', 'shadow-xs');
            btn.classList.add('text-slate-600', 'hover:bg-slate-100');
        }
    });

    const activeView = document.getElementById(`tab-${tabId}`);
    const activeBtn = document.getElementById(`btn-${tabId}`);

    if (activeView) activeView.classList.remove('hidden');
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-600', 'hover:bg-slate-100');
        activeBtn.classList.add('bg-blue-900', 'text-white', 'shadow-xs');
    }

    if (tabId === 'seguimiento') {
        sincronizarPacienteEnSeguimiento();
    } else if (tabId === 'photos') {
        cargarModuloFotos();
    }
}

function actualizarIndicadorConexion() {
    const cfg = window.ClinicaAPI.getConfig();
    const badge = document.getElementById('cloud-status-badge');
    const dot = document.getElementById('cloud-status-dot');
    const text = document.getElementById('cloud-status-text');

    if (badge && dot && text) {
        if (cfg.isConnected && cfg.url) {
            dot.className = 'pulse-dot online';
            text.textContent = `Supabase: ${cfg.schema}`;
            badge.className = 'flex items-center space-x-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full cursor-pointer hover:bg-emerald-100 transition';
        } else {
            dot.className = 'pulse-dot offline';
            text.textContent = 'Modo Local / clinica_mtc';
            badge.className = 'flex items-center space-x-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full cursor-pointer hover:bg-amber-100 transition';
        }
    }
}

function setupCloudModal() {
    const badge = document.getElementById('cloud-status-badge');
    const modal = document.getElementById('cloud-config-modal');
    const closeBtn = document.getElementById('btn-close-modal');
    const saveBtn = document.getElementById('btn-save-cloud-config');
    const testBtn = document.getElementById('btn-test-cloud-config');
    const resetDemoBtn = document.getElementById('btn-reset-demo-data');

    const inputUrl = document.getElementById('input-supabase-url');
    const inputKey = document.getElementById('input-supabase-key');
    const inputSchema = document.getElementById('input-supabase-schema');

    if (badge && modal) {
        badge.addEventListener('click', () => {
            const cfg = window.ClinicaAPI.getConfig();
            if (inputUrl) inputUrl.value = cfg.url || '';
            if (inputKey) inputKey.value = cfg.anonKey || '';
            if (inputSchema) inputSchema.value = cfg.schema || 'clinica_mtc';
            modal.classList.remove('hidden');
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const url = inputUrl.value.trim();
            const key = inputKey.value.trim();
            const schema = inputSchema.value.trim() || 'clinica_mtc';

            window.ClinicaAPI.saveConfig(url, key, schema);
            actualizarIndicadorConexion();
            modal.classList.add('hidden');
            mostrarToast('Configuración de Supabase guardada exitosamente.', 'success');
            await cargarPacientes();
        });
    }

    if (testBtn) {
        testBtn.addEventListener('click', async () => {
            testBtn.disabled = true;
            testBtn.textContent = 'Probando conexión...';
            const res = await window.ClinicaAPI.testConnection();
            testBtn.disabled = false;
            testBtn.textContent = 'Probar Conexión con Supabase';
            if (res.ok) {
                mostrarToast(`✓ ${res.message}`, 'success');
            } else {
                mostrarToast(`Atención: ${res.message}`, 'warning');
            }
        });
    }

    if (resetDemoBtn) {
        resetDemoBtn.addEventListener('click', async () => {
            if (confirm('¿Deseas restablecer los datos de prueba iniciales (María Elena y Carlos)?')) {
                window.ClinicaAPI.resetDemoData();
                await cargarPacientes();
                mostrarToast('Base de datos restaurada con datos clínicos de prueba.', 'info');
                modal.classList.add('hidden');
            }
        });
    }
}

async function cargarPacientes() {
    try {
        const pacientes = await window.ClinicaAPI.pacientes.listar();
        ClinicaState.pacientes = pacientes;
        renderizarListaPacientes(pacientes);
        actualizarContadoresHeader(pacientes.length);
    } catch (err) {
        console.error('Error cargando pacientes:', err);
    }
}

function setupSearchModule() {
    const inputBuscar = document.getElementById('input-search-paciente');
    const btnNuevoPaciente = document.getElementById('btn-new-patient-shortcut');

    if (inputBuscar) {
        inputBuscar.addEventListener('input', async (e) => {
            const term = e.target.value.trim();
            const resultados = await window.ClinicaAPI.pacientes.buscar(term);
            renderizarListaPacientes(resultados);
        });
    }

    if (btnNuevoPaciente) {
        btnNuevoPaciente.addEventListener('click', () => {
            limpiarFormularioAnamnesis();
            switchTab('anamnesis');
        });
    }
}

function renderizarListaPacientes(pacientes) {
    const container = document.getElementById('patients-list-container');
    const emptyState = document.getElementById('patients-empty-state');
    if (!container) return;

    if (!pacientes || pacientes.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    container.innerHTML = pacientes.map(p => {
        const isSelected = p.id === ClinicaState.pacienteSeleccionadoId;
        const selectedClass = isSelected 
            ? 'border-blue-600 bg-blue-50/70 shadow-xs' 
            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/80';
        
        return `
            <div onclick="seleccionarPaciente('${p.id}')" 
                 class="p-4 rounded-xl border ${selectedClass} transition-standard cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div class="flex items-start space-x-3">
                    <div class="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        ${obtenerIniciales(p.nombre_completo)}
                    </div>
                    <div>
                        <div class="flex items-center space-x-2">
                            <h4 class="font-bold text-slate-900 text-base">${p.nombre_completo}</h4>
                            <span class="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                RUT: ${p.rut}
                            </span>
                        </div>
                        <div class="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span>📞 ${p.telefono || 'Sin teléfono'}</span>
                            <span>💼 ${p.ocupacion || 'No especificada'}</span>
                            <span>📅 Ingreso: ${formatearFecha(p.created_at)}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-2 shrink-0 self-end md:self-center">
                    <button class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-600 text-blue-700 bg-white hover:bg-blue-600 hover:text-white transition">
                        ${isSelected ? '✓ Seleccionado' : 'Ver Ficha Completa'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function seleccionarPaciente(pacienteId) {
    ClinicaState.pacienteSeleccionadoId = pacienteId;
    const paciente = await window.ClinicaAPI.pacientes.obtenerPorId(pacienteId);
    
    renderizarListaPacientes(ClinicaState.pacientes);
    if (!paciente) return;

    const headerPatientName = document.getElementById('header-active-patient');
    if (headerPatientName) {
        headerPatientName.textContent = paciente.nombre_completo;
    }

    await renderizarHistorialPaciente(paciente);
}

async function renderizarHistorialPaciente(paciente) {
    const panel = document.getElementById('patient-history-panel');
    if (!panel) return;

    panel.classList.remove('hidden');

    const [anamnesisList, seguimientosList] = await Promise.all([
        window.ClinicaAPI.anamnesis.obtenerPorPaciente(paciente.id),
        window.ClinicaAPI.seguimientos.obtenerPorPaciente(paciente.id)
    ]);

    document.getElementById('history-patient-name').textContent = paciente.nombre_completo;
    document.getElementById('history-patient-rut').textContent = `RUT: ${paciente.rut}`;
    document.getElementById('history-patient-contact').textContent = `${paciente.telefono} • ${paciente.email || 'Sin email'}`;
    
    const antMedicos = paciente.antecedentes_medicos || {};
    document.getElementById('history-antecedentes').textContent = 
        antMedicos.patologias ? `Patologías: ${antMedicos.patologias} | Alergias: ${antMedicos.alergias || 'No'}` : 'Sin antecedentes registrados';
    
    const meds = Array.isArray(paciente.medicamentos) ? paciente.medicamentos.join(', ') : (paciente.medicamentos || 'Ninguno');
    document.getElementById('history-medicamentos').textContent = meds || 'Sin medicamentos';

    const timelineContainer = document.getElementById('history-timeline-container');
    if (!timelineContainer) return;

    let timelineHtml = '';

    if (anamnesisList.length > 0) {
        const ana = anamnesisList[0];
        const elementosStr = Array.isArray(ana.elementos_5) ? ana.elementos_5.join(', ') : (ana.elementos_5 || 'No definidos');
        const bagangStr = typeof ana.sindromes_bagang === 'object' ? JSON.stringify(ana.sindromes_bagang) : ana.sindromes_bagang;
        
        timelineHtml += `
            <div class="relative pl-6 pb-6 border-l-2 border-blue-500 last:border-transparent">
                <div class="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-blue-600 border-4 border-white shadow-xs flex items-center justify-center text-white text-[10px] font-bold">1</div>
                <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="inline-block bg-blue-100 text-blue-900 text-xs px-2.5 py-0.5 rounded-full font-bold">Sesión 1: Ingreso & Anamnesis</span>
                            <h5 class="text-sm font-bold text-slate-900 mt-1">Motivo: ${ana.motivo_consulta}</h5>
                        </div>
                        <span class="text-xs text-slate-400 font-mono">${formatearFecha(ana.created_at)}</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div>
                            <span class="font-semibold text-blue-900 block">Diagnóstico de Lengua:</span>
                            <span>Cuerpo: ${ana.lengua_cuerpo || 'Normal'}</span><br>
                            <span>Color: ${ana.lengua_color || 'Rosada'}</span><br>
                            <span>Saburra: ${ana.lengua_saburra || 'Normal'}</span>
                        </div>
                        <div>
                            <span class="font-semibold text-blue-900 block">Desequilibrio MTC:</span>
                            <span>5 Elementos: ${elementosStr}</span><br>
                            <span>Ba Gang: ${bagangStr || 'Calor / Yang'}</span>
                        </div>
                        <div>
                            <span class="font-semibold text-blue-900 block">Principio Terapéutico:</span>
                            <span class="italic text-slate-700">${ana.espiritu_tratamiento || 'Armonizar Qi y Sangre.'}</span>
                        </div>
                    </div>

                    ${renderizarPuntosAuricularesBadge(ana.puntos_auriculoterapia_inicial)}
                </div>
            </div>
        `;
    }

    if (seguimientosList.length > 0) {
        seguimientosList.forEach(seg => {
            timelineHtml += `
                <div class="relative pl-6 pb-6 border-l-2 border-blue-400 last:border-transparent">
                    <div class="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-xs flex items-center justify-center text-white text-[10px] font-bold">
                        ${seg.numero_tratamiento}
                    </div>
                    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                        <div class="flex justify-between items-start">
                            <div>
                                <span class="inline-block bg-emerald-100 text-emerald-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                    Sesión ${seg.numero_tratamiento}: Seguimiento de Evolución
                                </span>
                                <h5 class="text-sm font-semibold text-slate-900 mt-1">Evolución: ${seg.evolucion_general}</h5>
                            </div>
                            <span class="text-xs text-slate-400 font-mono">${formatearFecha(seg.created_at)}</span>
                        </div>

                        ${seg.cambios_sintomas ? `
                            <p class="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                <strong>Cambios en síntomas:</strong> ${seg.cambios_sintomas}
                            </p>
                        ` : ''}

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div class="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                                <span class="font-semibold text-blue-900 block mb-1">Lengua en esta sesión:</span>
                                <span>Cuerpo: ${seg.lengua_cuerpo_actual || 'Estable'} | Color: ${seg.lengua_color_actual || 'Rosada'} | Saburra: ${seg.lengua_saburra_actual || 'Normal'}</span>
                            </div>
                            <div class="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                                <span class="font-semibold text-blue-900 block mb-1">Técnicas Especiales:</span>
                                <span>${seg.tecnicas_especiales || 'Solo Auriculoterapia estándar'}</span>
                            </div>
                        </div>

                        ${renderizarPuntosAuricularesBadge(seg.puntos_auriculoterapia)}
                    </div>
                </div>
            `;
        });
    }

    timelineContainer.innerHTML = timelineHtml || '<p class="text-xs text-slate-500 italic">No se registran sesiones aún para este paciente.</p>';
}

function renderizarPuntosAuricularesBadge(puntos) {
    if (!puntos || !Array.isArray(puntos) || puntos.length === 0) return '';

    const badges = puntos.map(p => `
        <span class="inline-flex items-center text-[11px] font-medium bg-blue-50 text-blue-900 border border-blue-200 px-2 py-1 rounded-md">
            📍 <strong>${p.punto}</strong> (${p.zona}) — <span class="text-blue-700 ml-1 font-normal">${p.material || 'Semillas'} [${p.lateralidad || 'Bilateral'}]</span>
        </span>
    `).join(' ');

    return `
        <div class="pt-2 border-t border-slate-100">
            <span class="text-[11px] font-bold text-slate-700 block mb-1">Puntos de Auriculoterapia aplicados:</span>
            <div class="flex flex-wrap gap-1.5">${badges}</div>
        </div>
    `;
}

function setupAnamnesisModule() {
    const form = document.getElementById('form-anamnesis');
    const btnAgregarPunto = document.getElementById('btn-add-punto-ingreso');
    const inputRut = document.getElementById('ana-rut');

    if (inputRut) {
        inputRut.addEventListener('input', (e) => {
            e.target.value = formatearRutChileno(e.target.value);
        });
    }

    if (btnAgregarPunto) {
        btnAgregarPunto.addEventListener('click', () => {
            const zona = document.getElementById('ana-punto-zona').value;
            const punto = document.getElementById('ana-punto-nombre').value.trim();
            const material = document.getElementById('ana-punto-material').value;
            const lateralidad = document.getElementById('ana-punto-lateralidad').value;

            if (!punto) {
                mostrarToast('Por favor escribe el nombre del punto auricular.', 'warning');
                return;
            }

            agregarPuntoIngreso(zona, punto, material, lateralidad);
            document.getElementById('ana-punto-nombre').value = '';
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarAnamnesisIngreso();
        });
    }
}

function agregarPuntoIngreso(zona, punto, material, lateralidad) {
    ClinicaState.puntosIngresoTemp.push({ zona, punto, material, lateralidad });
    renderizarPuntosIngresoTemp();
}

function eliminarPuntoIngreso(index) {
    ClinicaState.puntosIngresoTemp.splice(index, 1);
    renderizarPuntosIngresoTemp();
}

function renderizarPuntosIngresoTemp() {
    const list = document.getElementById('ana-puntos-agregados-lista');
    if (!list) return;

    if (ClinicaState.puntosIngresoTemp.length === 0) {
        list.innerHTML = '<span class="text-xs text-slate-400 italic">No has agregado puntos todavía. Usa el selector arriba.</span>';
        return;
    }

    list.innerHTML = ClinicaState.puntosIngresoTemp.map((p, idx) => `
        <div class="flex items-center justify-between text-xs bg-white border border-blue-200 rounded-lg px-3 py-1.5 shadow-2xs">
            <span><strong>${p.punto}</strong> (${p.zona}) — ${p.material} <span class="text-slate-500 font-mono">[${p.lateralidad}]</span></span>
            <button type="button" onclick="eliminarPuntoIngreso(${idx})" class="text-rose-500 hover:text-rose-700 ml-2 font-bold">×</button>
        </div>
    `).join('');
}

async function guardarAnamnesisIngreso() {
    const btnSubmit = document.getElementById('btn-submit-anamnesis');
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Guardando en Supabase (clinica_mtc)...';
    }

    try {
        const nombreCompleto = document.getElementById('ana-nombre').value.trim();
        const rut = document.getElementById('ana-rut').value.trim();
        const telefono = document.getElementById('ana-telefono').value.trim();
        const email = document.getElementById('ana-email').value.trim();
        const fechaNacimiento = document.getElementById('ana-nacimiento').value;
        const ocupacion = document.getElementById('ana-ocupacion').value.trim();

        if (!nombreCompleto || !rut) {
            mostrarToast('Nombre completo y RUT son campos requeridos.', 'warning');
            return;
        }

        const antecedentesMedicos = {
            patologias: document.getElementById('ana-patologias').value.trim(),
            cirugias: document.getElementById('ana-cirugias').value.trim(),
            alergias: document.getElementById('ana-alergias').value.trim()
        };

        const medicamentos = document.getElementById('ana-medicamentos').value
            .split(',')
            .map(m => m.trim())
            .filter(Boolean);

        const habitos = {
            sueno: document.getElementById('ana-habito-sueno').value.trim(),
            digestion: document.getElementById('ana-habito-digestion').value.trim(),
            emociones: document.getElementById('ana-habito-emociones').value.trim(),
            sed: document.getElementById('ana-habito-sed').value.trim()
        };

        const nuevoPaciente = await window.ClinicaAPI.pacientes.crear({
            nombre_completo: nombreCompleto,
            rut: rut,
            telefono: telefono,
            email: email,
            fecha_nacimiento: fechaNacimiento,
            ocupacion: ocupacion,
            antecedentes_medicos: antecedentesMedicos,
            medicamentos: medicamentos,
            habitos: habitos
        });

        const motivoConsulta = document.getElementById('ana-motivo').value.trim();
        const tiempoDolencia = document.getElementById('ana-tiempo-dolencia').value.trim();
        const diagnosticoOccidental = document.getElementById('ana-diag-occidental').value.trim();

        const elementosSeleccionados = Array.from(document.querySelectorAll('input[name="cinco_elementos"]:checked'))
            .map(el => el.value);

        const sindromesBaGang = {
            polaridad: document.getElementById('ana-bagang-polaridad').value,
            localizacion: document.getElementById('ana-bagang-localizacion').value,
            temperatura: document.getElementById('ana-bagang-temperatura').value,
            fuerza: document.getElementById('ana-bagang-fuerza').value
        };

        const espirituTratamiento = document.getElementById('ana-espiritu').value.trim();

        await window.ClinicaAPI.anamnesis.crear({
            paciente_id: nuevoPaciente.id,
            motivo_consulta: motivoConsulta,
            tiempo_dolencia: tiempoDolencia,
            diagnostico_occidental: diagnosticoOccidental,
            lengua_cuerpo: document.getElementById('ana-lengua-cuerpo').value,
            lengua_color: document.getElementById('ana-lengua-color').value,
            lengua_saburra: document.getElementById('ana-lengua-saburra').value,
            elementos_5: elementosSeleccionados,
            sindromes_bagang: sindromesBaGang,
            organos_comprometidos: [document.getElementById('ana-organo-principal').value],
            meridianos_comprometidos: [document.getElementById('ana-meridiano-principal').value],
            espiritu_tratamiento: espirituTratamiento,
            puntos_auriculoterapia_inicial: ClinicaState.puntosIngresoTemp
        });

        mostrarToast(`Ficha de ingreso creada exitosamente para ${nombreCompleto}.`, 'success');
        
        await cargarPacientes();
        seleccionarPaciente(nuevoPaciente.id);
        switchTab('search');
    } catch (err) {
        console.error('Error guardando anamnesis:', err);
        mostrarToast('Error al guardar la ficha clínica. Verifique los campos.', 'error');
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Guardar Ficha de Ingreso (Anamnesis)';
        }
    }
}

function limpiarFormularioAnamnesis() {
    const form = document.getElementById('form-anamnesis');
    if (form) form.reset();
    ClinicaState.puntosIngresoTemp = [];
    renderizarPuntosIngresoTemp();
}

function setupSeguimientoModule() {
    const form = document.getElementById('form-seguimiento');
    const btnAddPunto = document.getElementById('btn-add-punto-seg');
    const selectPaciente = document.getElementById('seg-select-paciente');

    if (selectPaciente) {
        selectPaciente.addEventListener('change', (e) => {
            ClinicaState.pacienteSeleccionadoId = e.target.value;
            calcularSiguienteSesionNumero(e.target.value);
        });
    }

    if (btnAddPunto) {
        btnAddPunto.addEventListener('click', () => {
            const zona = document.getElementById('seg-punto-zona').value;
            const punto = document.getElementById('seg-punto-nombre').value.trim();
            const material = document.getElementById('seg-punto-material').value;
            const lateralidad = document.getElementById('seg-punto-lateralidad').value;

            if (!punto) {
                mostrarToast('Escribe el nombre del punto para el seguimiento.', 'warning');
                return;
            }

            agregarPuntoSeguimiento(zona, punto, material, lateralidad);
            document.getElementById('seg-punto-nombre').value = '';
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarSeguimiento();
        });
    }
}

function sincronizarPacienteEnSeguimiento() {
    const select = document.getElementById('seg-select-paciente');
    if (!select) return;

    select.innerHTML = ClinicaState.pacientes.map(p => `
        <option value="${p.id}" ${p.id === ClinicaState.pacienteSeleccionadoId ? 'selected' : ''}>
            ${p.nombre_completo} (RUT: ${p.rut})
        </option>
    `).join('');

    if (ClinicaState.pacienteSeleccionadoId) {
        calcularSiguienteSesionNumero(ClinicaState.pacienteSeleccionadoId);
    }
}

async function calcularSiguienteSesionNumero(pacienteId) {
    const numInput = document.getElementById('seg-numero-tratamiento');
    if (!numInput) return;

    try {
        const segs = await window.ClinicaAPI.seguimientos.obtenerPorPaciente(pacienteId);
        const nextNum = segs.length > 0 ? (Math.max(...segs.map(s => s.numero_tratamiento || 1)) + 1) : 2;
        numInput.value = nextNum;
    } catch (e) {
        numInput.value = 2;
    }
}

function agregarPuntoSeguimiento(zona, punto, material, lateralidad) {
    ClinicaState.puntosSeguimientoTemp.push({ zona, punto, material, lateralidad });
    renderizarPuntosSeguimientoTemp();
}

function eliminarPuntoSeguimiento(index) {
    ClinicaState.puntosSeguimientoTemp.splice(index, 1);
    renderizarPuntosSeguimientoTemp();
}

function renderizarPuntosSeguimientoTemp() {
    const list = document.getElementById('seg-puntos-agregados-lista');
    if (!list) return;

    if (ClinicaState.puntosSeguimientoTemp.length === 0) {
        list.innerHTML = '<span class="text-xs text-slate-400 italic">No has seleccionado puntos para esta sesión.</span>';
        return;
    }

    list.innerHTML = ClinicaState.puntosSeguimientoTemp.map((p, idx) => `
        <div class="flex items-center justify-between text-xs bg-white border border-blue-200 rounded-lg px-3 py-1.5 shadow-2xs">
            <span><strong>${p.punto}</strong> (${p.zona}) — ${p.material} [${p.lateralidad}]</span>
            <button type="button" onclick="eliminarPuntoSeguimiento(${idx})" class="text-rose-500 hover:text-rose-700 ml-2 font-bold">×</button>
        </div>
    `).join('');
}

async function guardarSeguimiento() {
    const pacienteId = document.getElementById('seg-select-paciente').value;
    const numeroTratamiento = document.getElementById('seg-numero-tratamiento').value;
    const evolucionGeneral = document.getElementById('seg-evolucion').value.trim();
    const cambiosSintomas = document.getElementById('seg-cambios-sintomas').value.trim();

    if (!pacienteId || !evolucionGeneral) {
        mostrarToast('Debe seleccionar paciente y describir la evolución.', 'warning');
        return;
    }

    const btnSubmit = document.getElementById('btn-submit-seguimiento');
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Guardando seguimiento...';
    }

    try {
        await window.ClinicaAPI.seguimientos.crear({
            paciente_id: pacienteId,
            numero_tratamiento: Number(numeroTratamiento) || 2,
            evolucion_general: evolucionGeneral,
            cambios_sintomas: cambiosSintomas,
            lengua_cuerpo_actual: document.getElementById('seg-lengua-cuerpo').value,
            lengua_color_actual: document.getElementById('seg-lengua-color').value,
            lengua_saburra_actual: document.getElementById('seg-lengua-saburra').value,
            puntos_auriculoterapia: ClinicaState.puntosSeguimientoTemp,
            tecnicas_especiales: document.getElementById('seg-tecnicas-especiales').value.trim(),
            observaciones_terapeuta: document.getElementById('seg-observaciones').value.trim()
        });

        mostrarToast(`Sesión N° ${numeroTratamiento} registrada con éxito.`, 'success');
        
        seleccionarPaciente(pacienteId);
        switchTab('search');
    } catch (e) {
        console.error('Error guardando seguimiento:', e);
        mostrarToast('Error al registrar el seguimiento.', 'error');
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Guardar Seguimiento de Sesión';
        }
    }
}

let datosExtraidosPorIATemp = null;

function setupAIModule() {
    const dropzone = document.getElementById('ai-dropzone');
    const fileInput = document.getElementById('ai-file-input');
    const btnCargarMuestra = document.getElementById('btn-ai-load-sample');
    const btnAplicarAFicha = document.getElementById('btn-ai-apply-to-form');

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('border-blue-600', 'bg-blue-50/50');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('border-blue-600', 'bg-blue-50/50');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-blue-600', 'bg-blue-50/50');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                procesarArchivoIA(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                procesarArchivoIA(e.target.files[0]);
            }
        });
    }

    if (btnCargarMuestra) {
        btnCargarMuestra.addEventListener('click', () => {
            cargarMuestraClinicaIA();
        });
    }

    if (btnAplicarAFicha) {
        btnAplicarAFicha.addEventListener('click', () => {
            aplicarDatosExtraidosAFicha();
        });
    }
}

function procesarArchivoIA(file) {
    const statusText = document.getElementById('ai-processing-status');
    const resultBox = document.getElementById('ai-results-box');

    if (statusText) statusText.classList.remove('hidden');
    if (resultBox) resultBox.classList.add('hidden');

    setTimeout(() => {
        if (statusText) statusText.classList.add('hidden');

        datosExtraidosPorIATemp = {
            nombre_completo: 'Roberto Andrés Carrasco Peña',
            rut: '16.782.901-4',
            telefono: '+56 9 7890 1234',
            email: 'r.carrasco@empresa.cl',
            ocupacion: 'Docente Universitario',
            motivo_consulta: 'Insomnio severo, palpitaciones nocturnas ocasionales, bruxismo diurno y dolor lumbar sordo.',
            tiempo_dolencia: '1 año de evolución progresiva',
            diagnostico_occidental: 'Estrés laboral crónico / Trastorno del ritmo circadiano',
            lengua_cuerpo: 'Delgada con fisuras centrales',
            lengua_color: 'Roja en la punta y centro',
            lengua_saburra: 'Pelada/Geográfica en tercio medio',
            elementos_5: ['Fuego (Corazón/Intestino Delgado)', 'Agua (Riñón/Vejiga)'],
            sindromes_bagang: {
                polaridad: 'Yin',
                localizacion: 'Interior',
                temperatura: 'Calor Vacío por Deficiencia de Yin',
                fuerza: 'Vacío de Yin de Riñón y Fuego de Corazón'
            },
            espiritu_tratamiento: 'Nutrir el Yin de Riñón, drenar el Fuego del Corazón, calmar el Shen y armonizar el eje Shao Yin.',
            puntos_sugeridos: [
                { zona: 'Fosa Triangular', punto: 'Shen Men', material: 'Semillas de Vaccaria', lateralidad: 'Bilateral' },
                { zona: 'Concha Cava', punto: 'Corazón', material: 'Balines Dorados', lateralidad: 'Izquierdo' },
                { zona: 'Concha Cimba', punto: 'Riñón', material: 'Balines Magnéticos', lateralidad: 'Bilateral' },
                { zona: 'Antitrago', punto: 'Subcórtex', material: 'Semillas de Vaccaria', lateralidad: 'Derecho' }
            ]
        };

        mostrarResultadosIA(datosExtraidosPorIATemp, file.name);
    }, 1200);
}

function cargarMuestraClinicaIA() {
    procesarArchivoIA({ name: 'Informe_Anamnesis_Roberto_Carrasco_MTC.pdf' });
}

function mostrarResultadosIA(datos, filename) {
    const resultBox = document.getElementById('ai-results-box');
    const container = document.getElementById('ai-extracted-fields-container');
    const badgeFile = document.getElementById('ai-badge-filename');

    if (badgeFile) badgeFile.textContent = filename || 'Documento procesado';

    if (container) {
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div class="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                    <span class="font-bold text-blue-900 uppercase text-[10px] tracking-wider block">Identificación Extraída (Confianza: 98%)</span>
                    <p><strong>Paciente:</strong> ${datos.nombre_completo}</p>
                    <p><strong>RUT:</strong> ${datos.rut}</p>
                    <p><strong>Contacto:</strong> ${datos.telefono} | ${datos.email}</p>
                    <p><strong>Ocupación:</strong> ${datos.ocupacion}</p>
                </div>
                <div class="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                    <span class="font-bold text-blue-900 uppercase text-[10px] tracking-wider block">Diagnóstico Occidental & Motivo</span>
                    <p><strong>Motivo:</strong> ${datos.motivo_consulta}</p>
                    <p><strong>Tiempo:</strong> ${datos.tiempo_dolencia}</p>
                    <p><strong>Médico Occidental:</strong> ${datos.diagnostico_occidental}</p>
                </div>
            </div>

            <div class="bg-blue-50/60 p-4 rounded-xl border border-blue-200 text-xs space-y-2 mt-3">
                <span class="font-bold text-blue-900 uppercase text-[10px] tracking-wider block">Clasificación MTC Deducida</span>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <span class="font-semibold text-slate-700">Lengua Detectada:</span>
                        <ul class="list-disc list-inside text-slate-600 mt-0.5">
                            <li>Cuerpo: ${datos.lengua_cuerpo}</li>
                            <li>Color: ${datos.lengua_color}</li>
                            <li>Saburra: ${datos.lengua_saburra}</li>
                        </ul>
                    </div>
                    <div>
                        <span class="font-semibold text-slate-700">Ejes Comprometidos:</span>
                        <p class="text-slate-600 mt-0.5">5 Elementos: <strong>${datos.elementos_5.join(', ')}</strong></p>
                        <p class="text-slate-600">Síndrome: ${datos.sindromes_bagang.fuerza}</p>
                    </div>
                    <div>
                        <span class="font-semibold text-slate-700">Puntos Auriculares Recomendados:</span>
                        <p class="text-slate-600 mt-0.5">${datos.puntos_sugeridos.map(p => p.punto).join(', ')}</p>
                    </div>
                </div>
            </div>
        `;
    }

    if (resultBox) resultBox.classList.remove('hidden');
}

function aplicarDatosExtraidosAFicha() {
    if (!datosExtraidosPorIATemp) return;

    document.getElementById('ana-nombre').value = datosExtraidosPorIATemp.nombre_completo || '';
    document.getElementById('ana-rut').value = datosExtraidosPorIATemp.rut || '';
    document.getElementById('ana-telefono').value = datosExtraidosPorIATemp.telefono || '';
    document.getElementById('ana-email').value = datosExtraidosPorIATemp.email || '';
    document.getElementById('ana-ocupacion').value = datosExtraidosPorIATemp.ocupacion || '';
    document.getElementById('ana-motivo').value = datosExtraidosPorIATemp.motivo_consulta || '';
    document.getElementById('ana-tiempo-dolencia').value = datosExtraidosPorIATemp.tiempo_dolencia || '';
    document.getElementById('ana-diag-occidental').value = datosExtraidosPorIATemp.diagnostico_occidental || '';
    
    document.getElementById('ana-espiritu').value = datosExtraidosPorIATemp.espiritu_tratamiento || '';

    ClinicaState.puntosIngresoTemp = [...datosExtraidosPorIATemp.puntos_sugeridos];
    renderizarPuntosIngresoTemp();

    switchTab('anamnesis');
    mostrarToast('✓ Datos de Roberto Carrasco cargados en el formulario de Ingreso. Puedes revisarlos y guardar.', 'success');
}

function setupPhotosModule() {
    const btnSideBySide = document.getElementById('btn-photo-mode-side');
    const btnSlider = document.getElementById('btn-photo-mode-slider');
    const selectPaciente = document.getElementById('photo-select-paciente');
    const selectTipo = document.getElementById('photo-select-organo');
    const sliderInput = document.getElementById('photo-slider-range');
    const btnNuevaFoto = document.getElementById('btn-upload-photo');

    if (btnSideBySide) {
        btnSideBySide.addEventListener('click', () => {
            ClinicaState.modoComparador = 'side-by-side';
            actualizarModoComparadorUI();
        });
    }

    if (btnSlider) {
        btnSlider.addEventListener('click', () => {
            ClinicaState.modoComparador = 'slider';
            actualizarModoComparadorUI();
        });
    }

    if (selectPaciente) {
        selectPaciente.addEventListener('change', (e) => {
            ClinicaState.pacienteSeleccionadoId = e.target.value;
            cargarFotosComparativa();
        });
    }

    if (selectTipo) {
        selectTipo.addEventListener('change', () => {
            cargarFotosComparativa();
        });
    }

    if (sliderInput) {
        sliderInput.addEventListener('input', (e) => {
            const val = e.target.value;
            const overlay = document.getElementById('comparison-overlay-split');
            const handle = document.getElementById('comparison-slider-handle');
            if (overlay) overlay.style.width = `${val}%`;
            if (handle) handle.style.left = `${val}%`;
        });
    }

    if (btnNuevaFoto) {
        btnNuevaFoto.addEventListener('click', () => registrarNuevaFotografia());
    }
}

function actualizarModoComparadorUI() {
    const viewSide = document.getElementById('comparison-view-side-by-side');
    const viewSlider = document.getElementById('comparison-view-slider');
    const btnSide = document.getElementById('btn-photo-mode-side');
    const btnSlider = document.getElementById('btn-photo-mode-slider');

    if (ClinicaState.modoComparador === 'side-by-side') {
        if (viewSide) viewSide.classList.remove('hidden');
        if (viewSlider) viewSlider.classList.add('hidden');
        if (btnSide) btnSide.className = 'flex-1 text-xs py-1 rounded font-bold bg-blue-900 text-white';
        if (btnSlider) btnSlider.className = 'flex-1 text-xs py-1 rounded font-medium text-slate-600 hover:bg-slate-100';
    } else {
        if (viewSide) viewSide.classList.add('hidden');
        if (viewSlider) viewSlider.classList.remove('hidden');
        if (btnSide) btnSide.className = 'flex-1 text-xs py-1 rounded font-medium text-slate-600 hover:bg-slate-100';
        if (btnSlider) btnSlider.className = 'flex-1 text-xs py-1 rounded font-bold bg-blue-900 text-white';
    }
}

async function cargarModuloFotos() {
    const select = document.getElementById('photo-select-paciente');
    if (!select) return;

    select.innerHTML = ClinicaState.pacientes.map(p => `
        <option value="${p.id}" ${p.id === ClinicaState.pacienteSeleccionadoId ? 'selected' : ''}>
            ${p.nombre_completo}
        </option>
    `).join('');

    await cargarFotosComparativa();
}

async function cargarFotosComparativa() {
    const pacienteId = document.getElementById('photo-select-paciente').value;
    const organo = document.getElementById('photo-select-organo').value;

    if (!pacienteId) return;

    const media = await window.ClinicaAPI.multimedia.obtenerPorPaciente(pacienteId);

    const fotoIngreso = media.find(m => m.tipo === `${organo}_ingreso`);
    const fotoSeguimiento = media.find(m => m.tipo === `${organo}_seguimiento`);

    const imgIngresoUrl = fotoIngreso ? fotoIngreso.url_archivo : 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80';
    const imgSegUrl = fotoSeguimiento ? fotoSeguimiento.url_archivo : 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80';

    const imgSide1 = document.getElementById('photo-side-1');
    const imgSide2 = document.getElementById('photo-side-2');
    const noteSide1 = document.getElementById('photo-note-1');
    const noteSide2 = document.getElementById('photo-note-2');

    if (imgSide1) imgSide1.src = imgIngresoUrl;
    if (imgSide2) imgSide2.src = imgSegUrl;
    if (noteSide1) noteSide1.textContent = (fotoIngreso && fotoIngreso.metadata && fotoIngreso.metadata.notas) || 'Sesión 1 (Ingreso Clínico Inicial)';
    if (noteSide2) noteSide2.textContent = (fotoSeguimiento && fotoSeguimiento.metadata && fotoSeguimiento.metadata.notas) || 'Sesión Actual (Seguimiento)';

    const imgSplitBefore = document.getElementById('photo-split-before');
    const imgSplitAfter = document.getElementById('photo-split-after');

    if (imgSplitBefore) imgSplitBefore.src = imgIngresoUrl;
    if (imgSplitAfter) imgSplitAfter.src = imgSegUrl;
}

async function registrarNuevaFotografia() {
    const pacienteId = document.getElementById('photo-select-paciente').value;
    const organo = document.getElementById('photo-select-organo').value;
    const urlInput = prompt('Ingresa la URL de la nueva fotografía clínica (o déjalo en blanco para usar imagen de cámara clínica de muestra):');
    const notas = prompt('Observación clínica de la imagen (ej. Disminución de eritema o respuesta a Vaccaria):', 'Evolución favorable observada en consulta');

    const nuevaUrl = urlInput && urlInput.trim() 
        ? urlInput.trim() 
        : 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80';

    await window.ClinicaAPI.multimedia.registrar({
        paciente_id: pacienteId,
        tipo: `${organo}_seguimiento`,
        url_archivo: nuevaUrl,
        metadata: { notas: notas }
    });

    mostrarToast('Nueva fotografía clínica guardada en multimedia.', 'success');
    await cargarFotosComparativa();
}

function formatearFecha(isoString) {
    if (!isoString) return 'Fecha no reg.';
    try {
        const d = new Date(isoString);
        return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
        return isoString;
    }
}

function formatearRutChileno(rutRaw) {
    let clean = (rutRaw || '').replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length === 0) return '';
    if (clean.length === 1) return clean;

    const dv = clean.slice(-1);
    let cuerpo = clean.slice(0, -1);
    cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${cuerpo}-${dv}`;
}

function obtenerIniciales(nombre) {
    if (!nombre) return 'PT';
    const partes = nombre.trim().split(' ');
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
}

function actualizarContadoresHeader(totalPacientes) {
    const el = document.getElementById('header-total-patients-count');
    if (el) el.textContent = totalPacientes;
}

function mostrarToast(mensaje, tipo = 'info') {
    const existing = document.getElementById('clinical-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'clinical-toast';

    let colorBg = 'bg-blue-900 border-blue-700 text-white';
    if (tipo === 'success') colorBg = 'bg-emerald-800 border-emerald-600 text-white';
    if (tipo === 'warning') colorBg = 'bg-amber-600 border-amber-500 text-white';
    if (tipo === 'error') colorBg = 'bg-rose-800 border-rose-600 text-white';

    toast.className = `fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl border ${colorBg} text-xs font-semibold flex items-center space-x-2 toast-animate`;
    toast.innerHTML = `<span>${tipo === 'success' ? '✓' : 'ℹ'}</span> <span>${mensaje}</span>`;

    document.body.appendChild(toast);

    setTimeout(() => {
        if (toast) toast.remove();
    }, 3800);
}
