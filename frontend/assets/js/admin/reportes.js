
const API_REPORTES = '../../backend/public/api/admin/reportes.php';
const API_BAN = '../../backend/public/api/admin/ban.php';
const API_ACTUALIZAR = '../../backend/public/api/admin/reportes_actualizar.php';

// Estado global
let idUsuarioABanear = null;
let idReporteActivo = null;
let idReporteAActualizar = null;
let todosLosReportes = [];
let filtroEstado = 'todos';
let filtroTipo = 'todos';

document.addEventListener('DOMContentLoaded', cargarReportes);

// ----- CARGA Y FILTRADO -----

async function cargarReportes() {
    const contenedor = document.getElementById('contenedorReportes');
    if (!contenedor) return;

    try {
        contenedor.innerHTML = '<div class="flex justify-center items-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00bf63]"></div></div>';

        const response = await fetch(API_REPORTES);
        const resultado = await response.json();

        if (!response.ok || !resultado.success) {
            throw new Error(resultado.errores?.general || 'Error al cargar los reportes desde la base de datos');
        }

        todosLosReportes = resultado.data;
        aplicarFiltros();

    } catch (error) {
        console.error('Error:', error);
        const contenedor = document.getElementById('contenedorReportes');
        contenedor.innerHTML = `<div class="p-4 bg-red-900/50 border border-red-500 rounded-xl text-red-200 text-sm font-bold">Error: ${error.message}</div>`;
    }
}

function aplicarFiltros() {
    const contenedor = document.getElementById('contenedorReportes');
    if (!contenedor) return;

    let filtrados = todosLosReportes;

    if (filtroEstado !== 'todos') {
        filtrados = filtrados.filter(r => r.estado === filtroEstado);
    }
    if (filtroTipo !== 'todos') {
        filtrados = filtrados.filter(r => r.tipo_reporte === filtroTipo);
    }

    renderizarReportes(filtrados, contenedor);
}

function setFiltroEstado(valor) {
    filtroEstado = valor;
    document.querySelectorAll('.filtro-estado-btn').forEach(btn => {
        btn.classList.toggle('activo', btn.dataset.valor === valor);
    });
    aplicarFiltros();
}

function setFiltroTipo(valor) {
    filtroTipo = valor;
    document.querySelectorAll('.filtro-tipo-btn').forEach(btn => {
        btn.classList.toggle('activo', btn.dataset.valor === valor);
    });
    aplicarFiltros();
}

// ----- RENDER -----

function renderizarReportes(reportes, contenedor) {
    contenedor.innerHTML = '';

    if (reportes.length === 0) {
        contenedor.innerHTML = `<p class="text-gray-500 text-center py-10 font-bold">No hay reportes con los filtros seleccionados.</p>`;
        return;
    }

    reportes.forEach(reporte => {
        let colorEstado = 'bg-red-500';
        if (reporte.estado === 'En Revisión') colorEstado = 'bg-yellow-500';
        if (reporte.estado === 'Resuelto' || reporte.estado === 'Desestimado') colorEstado = 'bg-gray-500';

        const fecha = new Date(reporte.fecha_creacion).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const tituloReporte = reporte.reportado_nickname
            ? `Reporte contra @${reporte.reportado_nickname}`
            : `Reporte General (${reporte.tipo_reporte})`;

        const btnEstado = `<button onclick="abrirModalEstado(${reporte.id_reporte}, '${reporte.estado}')" class="flex-1 md:flex-none border border-[#00bf63]/50 text-[#00bf63] px-4 py-2 rounded-lg font-bold text-xs hover:border-[#00bf63] hover:bg-[#00bf63]/10 transition">Estado</button>`;
        const btnIgnorar = `<button onclick="eliminarReporte(${reporte.id_reporte})" class="flex-1 md:flex-none bg-gray-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-gray-600 transition text-white">Ignorar</button>`;
        const btnBanear = reporte.reportado_nickname
            ? `<button onclick="abrirModalBaneo(${reporte.id_reportado}, '${reporte.reportado_nickname}', ${reporte.id_reporte})" class="flex-1 md:flex-none bg-red-600 px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-700 transition text-white shadow-lg shadow-red-600/20">Banear</button>`
            : '';

        const cardHTML = `
                    <div class="bg-[#111814] p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition hover:border-white/10">
                        <div class="flex items-center gap-4">
                            <div class="w-3 h-3 rounded-full ${colorEstado} shrink-0"></div>
                            <div>
                                <h4 class="font-black text-lg text-white">${tituloReporte} <span class="text-xs text-gray-500 font-normal ml-2 tracking-wider uppercase">(${reporte.estado})</span></h4>
                                <p class="text-gray-400 text-sm mt-1">Motivo: ${reporte.descripcion}</p>
                                <p class="text-[10px] text-gray-500 mt-2 font-bold tracking-wide">
                                    Tipo: <span class="text-white">${reporte.tipo_reporte}</span> &nbsp;·&nbsp;
                                    Enviado por: <span class="text-[#00bf63]">@${reporte.emisor_nickname}</span> &nbsp;·&nbsp; ${fecha}
                                </p>
                            </div>
                        </div>
                        <div class="flex gap-2 w-full md:w-auto mt-4 md:mt-0 shrink-0">
                            ${btnEstado}
                            ${btnIgnorar}
                            ${btnBanear}
                        </div>
                    </div>
                `;
        contenedor.innerHTML += cardHTML;
    });
}

// ----- MODAL ESTADO -----

function abrirModalEstado(idReporte, estadoActual) {
    idReporteAActualizar = idReporte;
    document.getElementById('reporteIdLabel').innerText = '#' + idReporte;
    document.getElementById('nuevoEstado').value = estadoActual;
    document.getElementById('modalEstado').classList.remove('hidden');
}

function cerrarModalEstado() {
    document.getElementById('modalEstado').classList.add('hidden');
    idReporteAActualizar = null;
}

async function confirmarCambioEstado() {
    if (!idReporteAActualizar) return;

    const nuevoEstado = document.getElementById('nuevoEstado').value;

    try {
        const response = await fetch(API_ACTUALIZAR, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_reporte: idReporteAActualizar, estado: nuevoEstado })
        });

        const resultado = await response.json();

        if (response.ok && resultado.success) {
            // Actualizamos el array local sin recargar toda la lista
            todosLosReportes = todosLosReportes.map(r =>
                Number(r.id_reporte) === idReporteAActualizar ? { ...r, estado: nuevoEstado } : r
            );
            cerrarModalEstado();
            aplicarFiltros();
        } else {
            const mensajeError = resultado.errores ? Object.values(resultado.errores)[0] : 'Error desconocido';
            alert('No se pudo actualizar el estado: ' + mensajeError);
        }

    } catch (error) {
        console.error('Error en la red:', error);
        alert('Error crítico: No hay comunicación con el servidor.');
    }
}

// ----- MODAL BANEO -----

function abrirModalBaneo(idUsuario, nickname, idReporte) {
    idUsuarioABanear = idUsuario;
    idReporteActivo = idReporte;
    document.getElementById('usuarioBaneado').innerText = '@' + nickname;
    document.getElementById('modalBaneo').classList.remove('hidden');
}

function cerrarModal() {
    document.getElementById('modalBaneo').classList.add('hidden');
    document.getElementById('tipoBaneo').value = 'permanente';
    document.getElementById('seccionTemporal').classList.add('hidden');
    idUsuarioABanear = null;
    idReporteActivo = null;
}

function toggleTemporal() {
    const tipo = document.getElementById('tipoBaneo').value;
    const seccion = document.getElementById('seccionTemporal');
    seccion.classList.toggle('hidden', tipo !== 'temporal');
}

async function confirmarBaneo() {
    if (!idUsuarioABanear) {
        alert("Error del sistema: No se detectó el ID del usuario.");
        return;
    }

    const tipo = document.getElementById('tipoBaneo').value;
    const duracion = document.getElementById('duracionBaneo').value;
    const motivo = prompt("Requerido: Introduce el motivo del baneo (mínimo 3 caracteres):", "Incumplimiento de normas");

    if (motivo === null) return;

    if (motivo.trim().length < 3) {
        alert("Error: El motivo debe tener al menos 3 caracteres.");
        return;
    }

    const datos = { id_usuario: idUsuarioABanear, accion: 'banear', tipo: tipo, motivo: motivo.trim() };
    if (tipo === 'temporal') datos.duracion = parseInt(duracion);

    try {
        const response = await fetch(API_BAN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const resultado = await response.json();

        if (response.ok && resultado.success) {
            alert("Éxito: " + resultado.data.mensaje);

            if (idReporteActivo) {
                await fetch('../../backend/public/api/admin/reportes_eliminar.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_reporte: idReporteActivo })
                });
                todosLosReportes = todosLosReportes.filter(r => Number(r.id_reporte) !== idReporteActivo);
            }

            cerrarModal();
            aplicarFiltros();
        } else {
            const mensajeError = resultado.errores ? Object.values(resultado.errores)[0] : "Error desconocido";
            alert("No se pudo banear: " + mensajeError);
        }

    } catch (error) {
        console.error("Error en la red:", error);
        alert("Error crítico: No hay comunicación con el servidor.");
    }
}

// ----- ELIMINAR REPORTE -----

async function eliminarReporte(idReporte) {
    if (!confirm("¿Estás seguro de que deseas eliminar este reporte definitivamente?")) return;

    try {
        const response = await fetch('../../backend/public/api/admin/reportes_eliminar.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_reporte: idReporte })
        });
        const resultado = await response.json();

        if (response.ok && resultado.success) {
            todosLosReportes = todosLosReportes.filter(r => Number(r.id_reporte) !== idReporte);
            aplicarFiltros();
        } else {
            const mensajeError = resultado.errores ? Object.values(resultado.errores)[0] : "Error desconocido";
            alert("❌ No se pudo eliminar: " + mensajeError);
        }

    } catch (error) {
        console.error("Error en la red:", error);
        alert("Error crítico: No hay comunicación con el servidor.");
    }
}

// Cerrar modales clicando fuera
window.onclick = function (event) {
    if (event.target === document.getElementById('modalBaneo')) cerrarModal();
    if (event.target === document.getElementById('modalEstado')) cerrarModalEstado();
}

document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar-user-info');
    fetch('../../backend/public/api/auth/user.php', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.usuario) {
                const nombre = data.usuario.name || data.usuario.nickname;
                const foto = data.usuario.foto_perfil;
                let avatarHtml = '';
                if (foto) {
                    avatarHtml = `<img src="${foto}" alt="Avatar" class="w-10 h-10 rounded-full border border-[#00bf63] object-cover">`;
                } else {
                    avatarHtml = `<img src="../assets/img/no_user_profile.png" alt="Avatar" class="w-10 h-10 rounded-full border border-[#00bf63] object-cover">`;
                }
                sidebar.innerHTML = `
                        ${avatarHtml}
                        <div>
                            <p class='text-sm font-bold text-white'>${nombre}</p>
                            <p class='text-[10px] text-gray-500 uppercase tracking-widest'>Sporty</p>
                        </div>
                    `;
            } else {
                sidebar.innerHTML = `
                        <div class='w-10 h-10 rounded-full bg-[#111814] border border-[#00bf63] flex items-center justify-center text-[#00bf63] font-black'>A</div>
                        <div>
                            <p class='text-sm font-bold text-white'>Administrador</p>
                            <p class='text-[10px] text-gray-500 uppercase tracking-widest'>Sporty</p>
                        </div>
                    `;
            }
        })
        .catch(() => {
            sidebar.innerHTML = `
                    <div class='w-10 h-10 rounded-full bg-[#111814] border border-[#00bf63] flex items-center justify-center text-[#00bf63] font-black'>A</div>
                    <div>
                        <p class='text-sm font-bold text-white'>Administrador</p>
                        <p class='text-[10px] text-gray-500 uppercase tracking-widest'>Sporty</p>
                    </div>
                `;
        });
});