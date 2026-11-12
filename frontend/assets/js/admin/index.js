async function cargarDashboard() {
    const endpoint = '../../backend/public/api/admin/dashboard.php';

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            credentials: 'include'
        });

        let payload = null;
        try {
            payload = await response.json();
        } catch (e) {
            throw new Error('Respuesta no valida del servidor');
        }

        if (!response.ok || !payload.success) {
            if (response.status === 401 || response.status === 403) {
                window.location.href = '../auth/login.html';
                return;
            }

            throw new Error('No se pudo cargar el dashboard');
        }

        const data = payload.data || {};
        const resumen = data.resumen || {};
        const ultimosRegistros = Array.isArray(data.ultimos_registros) ? data.ultimos_registros : [];

        document.getElementById('total_usuarios').textContent = data.total_usuarios ?? 0;
        document.getElementById('usuarios_online').textContent = data.usuarios_online ?? 0;
        document.getElementById('total_reportes').textContent = data.total_reportes ?? 0;

        document.getElementById('count_deportes').textContent = resumen.deportes ?? 0;
        document.getElementById('count_ejercicios').textContent = resumen.ejercicios ?? 0;
        document.getElementById('count_sitios').textContent = resumen.sitios ?? 0;

        const lista = document.getElementById('lista_ultimos_registros');
        lista.innerHTML = '';

        if (ultimosRegistros.length === 0) {
            lista.innerHTML = '<p class="text-sm text-gray-400">No hay registros recientes.</p>';
            return;
        }

        ultimosRegistros.forEach((usuario) => {
            const row = document.createElement('div');
            row.className = 'bg-black/40 p-4 rounded-2xl border border-white/5';

            const badge = usuario.admin == 1
                ? '<span class="text-[10px] px-2 py-1 rounded-full bg-[#00bf63]/20 text-[#00bf63] border border-[#00bf63]/30">ADMIN</span>'
                : '<span class="text-[10px] px-2 py-1 rounded-full bg-white/10 text-gray-300 border border-white/10">USER</span>';

            row.innerHTML = `
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <p class="font-black text-white">${usuario.nickname || 'Sin nickname'}</p>
                                <p class="text-xs text-gray-400">${usuario.name || 'Sin nombre'}</p>
                                <p class="text-xs text-gray-500 mt-1">${usuario.email || 'Sin email'}</p>
                            </div>
                            ${badge}
                        </div>
                    `;

            lista.appendChild(row);
        });
    } catch (error) {
        console.error('Error cargando dashboard:', error);

        document.getElementById('total_usuarios').textContent = '0';
        document.getElementById('usuarios_online').textContent = '0';
        document.getElementById('total_reportes').textContent = '0';
        document.getElementById('count_deportes').textContent = '0';
        document.getElementById('count_ejercicios').textContent = '0';
        document.getElementById('count_sitios').textContent = '0';
        document.getElementById('lista_ultimos_registros').innerHTML = '<p class="text-sm text-red-400">No se pudieron cargar los datos.</p>';
    }
}

async function cerrarSesion(event) {
    event.preventDefault();

    try {
        await fetch('../../backend/public/api/auth/logout.php', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Error cerrando sesion:', error);
    } finally {
        window.location.href = '../auth/login.html';
    }
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', cerrarSesion);
}

cargarDashboard();

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
