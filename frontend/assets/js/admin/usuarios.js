let usuariosData = [];
let usuarioActual = null;

const cerrarModal = () => document.getElementById('modalAjustes').classList.add('hidden');
const toggleTemporal = () => document.getElementById('seccionTemporal').classList.toggle('hidden', document.getElementById('tipoBaneo').value !== 'temporal');

function obtenerIniciales(nombre) {
    if (!nombre) return 'US';
    const partes = nombre.trim().split(' ');
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return nombre.substring(0, 2).toUpperCase();
}

function abrirModalAjustes(idUsuario) {
    const u = usuariosData.find(x => x.id_usuario == idUsuario);
    if (!u) return;
    usuarioActual = u;

    const iniciales = obtenerIniciales(u.name || u.nickname);
    const esBaneado = parseInt(u.baneado) === 1;
    const rol = u.admin == 1 ? 'admin' : (u.entrenador == 1 ? 'entrenador' : 'usuario');

    document.getElementById('modal_avatar').innerText = iniciales;
    document.getElementById('modal_nombre').innerText = u.name || u.nickname;
    document.getElementById('modal_tag').innerText = '@' + u.nickname;
    document.getElementById('modal_email').innerText = u.email;
    document.getElementById('modal_deporte').innerText = u.deporte_favorito || 'No especificado';
    document.getElementById('modal_seguidores').innerText = u.total_seguidores || 0;
    document.getElementById('modal_posts').innerText = u.total_posts || 0;
    document.getElementById('modal_seguidos').innerText = u.total_seguidos || 0;
    document.getElementById('modal_verificado').innerText = parseInt(u.verificado) === 1 ? '✓ Verificado' : 'No';

    const estadoBadge = document.getElementById('modal_estado_badge');
    if (esBaneado) {
        estadoBadge.className = 'bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase inline-block';
        estadoBadge.innerText = 'Baneado';
    } else {
        estadoBadge.className = 'bg-green-500/10 text-[#00bf63] px-3 py-1 rounded-full text-[10px] font-black uppercase inline-block';
        estadoBadge.innerText = 'Activo';
    }

    const rolBadge = document.getElementById('modal_rol_badge');
    rolBadge.innerText = rol;
    if (rol === 'admin') {
        rolBadge.className = 'bg-yellow-500/10 text-yellow-400 px-3 py-1 rounded-full text-[10px] font-black italic uppercase inline-block';
    } else if (rol === 'entrenador') {
        rolBadge.className = 'bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black italic uppercase inline-block';
    } else {
        rolBadge.className = 'bg-gray-800 text-gray-400 px-3 py-1 rounded-full text-[10px] font-black italic uppercase inline-block';
    }

    // Info de baneo activo
    const infoBaneo = document.getElementById('modal_baneo_info');
    const detalleBaneo = document.getElementById('modal_baneo_detalle');
    const motivoBaneo = document.getElementById('modal_baneo_motivo');
    if (esBaneado) {
        infoBaneo.classList.remove('hidden');
        if (u.tipo_baneo === 'temporal' && u.fecha_fin_baneo) {
            const fin = new Date(u.fecha_fin_baneo).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            detalleBaneo.innerText = `Temporal · Expira el ${fin}`;
        } else {
            detalleBaneo.innerText = 'Permanente';
        }
        motivoBaneo.innerText = u.motivo_baneo ? `Motivo: ${u.motivo_baneo}` : 'Motivo: No especificado';
    } else {
        infoBaneo.classList.add('hidden');
    }

    // Mostrar/ocultar sección de restricción y botón según estado
    const seccionRestriccion = document.getElementById('seccion_restriccion');
    const btnAccion = document.getElementById('btnAccionBaneo');
    btnAccion.disabled = false;
    btnAccion.dataset.loading = '0';
    if (esBaneado) {
        seccionRestriccion.classList.add('hidden');
        btnAccion.innerText = 'Desbanear Usuario';
        btnAccion.className = 'w-full md:w-auto px-8 py-2.5 rounded-xl bg-orange-600 text-white font-black text-xs uppercase hover:bg-orange-700 transition-all order-1 md:order-2';
    } else {
        seccionRestriccion.classList.remove('hidden');
        document.getElementById('tipoBaneo').value = 'permanente';
        document.getElementById('seccionTemporal').classList.add('hidden');
        document.getElementById('motivoBaneo').value = '';
        btnAccion.innerText = 'Confirmar Baneo';
        btnAccion.className = 'w-full md:w-auto px-8 py-2.5 rounded-xl bg-red-600 text-white font-black text-xs uppercase hover:bg-red-700 transition-all order-1 md:order-2';
    }

    // No permitir banear admins
    if (rol === 'admin') {
        seccionRestriccion.classList.add('hidden');
        btnAccion.classList.add('hidden');
    } else {
        btnAccion.classList.remove('hidden');
    }

    document.getElementById('modalAjustes').classList.remove('hidden');
}

async function ejecutarAccionBaneo() {
    if (!usuarioActual) return;
    const esBaneado = parseInt(usuarioActual.baneado) === 1;
    const idUsuario = usuarioActual.id_usuario;
    const btnAccion = document.getElementById('btnAccionBaneo');

    if (btnAccion.dataset.loading === '1') return;

    btnAccion.disabled = true;
    btnAccion.dataset.loading = '1';
    btnAccion.innerText = esBaneado ? 'Desbaneando...' : 'Baneando...';

    try {
        const motivo = document.getElementById('motivoBaneo').value.trim();
        if (!esBaneado && motivo.length < 3) {
            alert('Debes indicar un motivo de al menos 3 caracteres');
            btnAccion.disabled = false;
            btnAccion.dataset.loading = '0';
            btnAccion.innerText = 'Confirmar Baneo';
            return;
        }

        const body = esBaneado
            ? { id_usuario: idUsuario, accion: 'desbanear' }
            : {
                id_usuario: idUsuario,
                accion: 'banear',
                tipo: document.getElementById('tipoBaneo').value,
                motivo,
                duracion: document.getElementById('tipoBaneo').value === 'temporal'
                    ? parseInt(document.getElementById('duracionBaneo').value)
                    : undefined
            };

        const res = await fetch('../../backend/public/api/admin/ban.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const json = await res.json();

        if (json.success) {
            cerrarModal();
            await cargarUsuarios();
        } else {
            const msg = Object.values(json.errores || {}).join(', ') || 'Error desconocido';
            alert('Error: ' + msg);
            btnAccion.disabled = false;
            btnAccion.dataset.loading = '0';
            btnAccion.innerText = esBaneado ? 'Desbanear Usuario' : 'Confirmar Baneo';
        }
    } catch (e) {
        alert('Error de conexión con el servidor');
        btnAccion.disabled = false;
        btnAccion.dataset.loading = '0';
        btnAccion.innerText = esBaneado ? 'Desbanear Usuario' : 'Confirmar Baneo';
    }
}

function filtrarTabla() {
    const busqueda = document.getElementById('buscador').value.toLowerCase();
    const filtro = document.getElementById('filtroTipo').value;
    document.querySelectorAll('#tablaUsuarios tr').forEach(fila => {
        const contenido = fila.innerText.toLowerCase();
        const tipo = fila.getAttribute('data-tipo');
        const coincideBusqueda = contenido.includes(busqueda);
        const coincideFiltro = filtro === 'todos' || tipo === filtro;
        fila.style.display = coincideBusqueda && coincideFiltro ? '' : 'none';
    });
}

async function cargarUsuarios() {
    try {
        const res = await fetch('../../backend/public/api/admin/usuarios.php');
        const json = await res.json();
        if (!json.success) return;

        usuariosData = json.data.usuarios;
        const tbody = document.getElementById('tablaUsuarios');

        tbody.innerHTML = usuariosData.map(u => {
            const esBaneado = parseInt(u.baneado) === 1;
            const rol = u.admin == 1 ? 'admin' : (u.entrenador == 1 ? 'entrenador' : 'usuario');
            const tipoFiltro = esBaneado ? 'baneado' : rol;
            const iniciales = obtenerIniciales(u.name || u.nickname);
            const fotoPerfil = u.foto_perfil ? u.foto_perfil : '../assets/img/no_user_profile.png';

            const estadoHtml = esBaneado
                ? `<span class="text-red-500 text-[10px] font-black uppercase tracking-widest">● Baneado</span>`
                : `<span class="text-[#00bf63] text-[10px] font-black uppercase tracking-widest">● Activo</span>`;

            const botonBanear = esBaneado
                ? `<button onclick="banearRapido(${u.id_usuario})" class="flex-1 md:flex-none bg-orange-600/10 text-orange-500 border border-orange-600/20 px-6 py-2.5 md:px-3 md:py-1 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all">Desbanear</button>`
                : `<button onclick="banearRapido(${u.id_usuario})" class="flex-1 md:flex-none bg-red-600/10 text-red-500 border border-red-600/20 px-6 py-2.5 md:px-3 md:py-1 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Banear</button>`;

            return `
                    <tr class="flex flex-col md:table-row border-t border-white/5 hover:bg-white/5 transition p-4 md:p-0 bg-[#111814] md:bg-transparent rounded-2xl md:rounded-none mb-4 md:mb-0" data-tipo="${tipoFiltro}">
                        <td class="p-2 md:p-4 flex items-center gap-4">
                            <img src="${fotoPerfil}" alt="Avatar" class="w-12 h-12 md:w-9 md:h-9 rounded-full object-cover bg-white">
                            <div class="flex flex-col">
                                <span class="font-black text-lg md:text-sm text-white">@${u.nickname}</span>
                                <span class="text-xs text-gray-500 md:hidden">${u.email}</span>
                            </div>
                        </td>
                        <td class="hidden md:table-cell p-4 text-gray-400 text-sm font-medium">${u.email}</td>
                        <td class="p-2 md:p-4 text-gray-500 font-black uppercase text-[10px] tracking-widest">${rol}</td>
                        <td class="p-2 md:p-4 text-center md:text-left">${estadoHtml}</td>
                        <td class="pt-4 md:pt-0 md:p-4 text-center border-t border-white/5 md:border-none">
                            <div class="flex flex-row md:justify-center gap-3">
                                ${u.admin == 1 ? '' : botonBanear}
                                <button onclick="abrirModalAjustes(${u.id_usuario})" class="md:hidden flex-1 bg-white/5 text-gray-400 px-4 py-2.5 rounded-xl border border-white/10 font-black text-[10px] uppercase">Perfil</button>
                            </div>
                        </td>
                        <td class="hidden md:table-cell p-4 text-center">
                            <button onclick="abrirModalAjustes(${u.id_usuario})" class="text-gray-500 hover:text-[#00bf63] transition-all p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 pointer-events-none inline">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            </button>
                        </td>
                    </tr>`;
        }).join('');
    } catch (e) { console.error("Error cargando usuarios", e); }
}

async function banearRapido(idUsuario) {
    const u = usuariosData.find(x => x.id_usuario == idUsuario);
    if (!u) return;
    const esBaneado = parseInt(u.baneado) === 1;
    const accion = esBaneado ? 'desbanear' : 'banear';
    const confirmMsg = esBaneado
        ? `¿Desbanear a @${u.nickname}?`
        : `¿Banear permanentemente a @${u.nickname}?`;

    if (!confirm(confirmMsg)) return;

    try {
        let motivo = '';
        if (!esBaneado) {
            motivo = prompt(`Motivo del baneo para @${u.nickname}:`) || '';
            motivo = motivo.trim();
            if (motivo.length < 3) {
                alert('Debes escribir un motivo de al menos 3 caracteres');
                return;
            }
        }

        const res = await fetch('../../backend/public/api/admin/ban.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario: idUsuario, accion, tipo: 'permanente', motivo })
        });
        const json = await res.json();
        if (json.success) {
            await cargarUsuarios();
        } else {
            alert('Error: ' + (Object.values(json.errores || {}).join(', ') || 'Error desconocido'));
        }
    } catch (e) {
        alert('Error de conexión con el servidor');
    }
}

document.addEventListener('DOMContentLoaded', cargarUsuarios);

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