let deportesData = [];
let ejerciciosData = [];

function escaparHtml(valor) {
    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getDeportesFiltrados() {
    const filtro = document.getElementById('buscadorDeportes').value.trim().toLowerCase();
    if (!filtro) return deportesData;
    return deportesData.filter(d => (d.nombre_deporte || '').toLowerCase().includes(filtro));
}

function getEjerciciosFiltrados() {
    const filtro = document.getElementById('buscadorEjercicios').value.trim().toLowerCase();
    if (!filtro) return ejerciciosData;
    return ejerciciosData.filter(e => {
        const nombre = (e.nombre_ejercicio || '').toLowerCase();
        const categoria = (e.nombre_deporte || '').toLowerCase();
        return nombre.includes(filtro) || categoria.includes(filtro);
    });
}

function renderDeportes() {
    const tbody = document.getElementById('tablaDeportes');
    const deportes = getDeportesFiltrados();

    if (!Array.isArray(deportes) || deportes.length === 0) {
        tbody.innerHTML = `
                    <tr>
                        <td colspan="2" class="py-6 text-center text-gray-500">No hay deportes para mostrar</td>
                    </tr>`;
        return;
    }

    tbody.innerHTML = deportes.map(item => `
                <tr class="border-b border-white/5 hover:bg-white/5 transition">
                    <td class="py-4 font-bold uppercase tracking-tight text-white">${escaparHtml(item.nombre_deporte)}</td>
                    <td class="py-4 text-center">
                        <button onclick="eliminarDeporte(${Number(item.id_deporte)})" class="text-red-500 hover:text-white transition text-xs font-black">ELIMINAR</button>
                    </td>
                </tr>`).join('');
}

function renderEjercicios() {
    const tbody = document.getElementById('tablaEjercicios');
    const ejercicios = getEjerciciosFiltrados();

    if (!Array.isArray(ejercicios) || ejercicios.length === 0) {
        tbody.innerHTML = `
                    <tr>
                        <td colspan="3" class="py-6 text-center text-gray-500">No hay ejercicios para mostrar</td>
                    </tr>`;
        return;
    }

    tbody.innerHTML = ejercicios.map(item => `
                <tr class="border-b border-white/5 hover:bg-white/5 transition">
                    <td class="py-4 font-bold text-white">${escaparHtml(item.nombre_ejercicio)}</td>
                    <td class="py-4 text-gray-400 italic">${escaparHtml(item.nombre_deporte)}</td>
                    <td class="py-4 text-center">
                        <button onclick="eliminarEjercicio(${Number(item.id_ejercicio)})" class="text-red-500 hover:text-white transition text-xs font-black">ELIMINAR</button>
                    </td>
                </tr>`).join('');
}

async function eliminar(tipo, id) {
    const res = await fetch('../../backend/public/api/admin/gestion_eliminar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, id })
    });
    return res.json();
}

async function eliminarDeporte(id) {
    const deporte = deportesData.find(d => Number(d.id_deporte) === Number(id));
    const nombre = deporte ? deporte.nombre_deporte : `ID ${id}`;

    if (!confirm(`¿Seguro que quieres eliminar el deporte "${nombre}"?`)) return;

    try {
        const json = await eliminar('deporte', id);
        if (!json.success) {
            const msg = Object.values(json.errores || {}).join(', ') || 'No se pudo eliminar el deporte';
            alert(msg);
            return;
        }
        await cargarGestion();
    } catch (error) {
        alert('Error de conexión con el servidor');
    }
}

async function eliminarEjercicio(id) {
    const ejercicio = ejerciciosData.find(e => Number(e.id_ejercicio) === Number(id));
    const nombre = ejercicio ? ejercicio.nombre_ejercicio : `ID ${id}`;

    if (!confirm(`¿Seguro que quieres eliminar el ejercicio "${nombre}"?`)) return;

    try {
        const json = await eliminar('ejercicio', id);
        if (!json.success) {
            const msg = Object.values(json.errores || {}).join(', ') || 'No se pudo eliminar el ejercicio';
            alert(msg);
            return;
        }
        await cargarGestion();
    } catch (error) {
        alert('Error de conexión con el servidor');
    }
}

async function cargarGestion() {
    const tablaDeportes = document.getElementById('tablaDeportes');
    const tablaEjercicios = document.getElementById('tablaEjercicios');

    tablaDeportes.innerHTML = '<tr><td colspan="2" class="py-6 text-center text-gray-500">Cargando...</td></tr>';
    tablaEjercicios.innerHTML = '<tr><td colspan="3" class="py-6 text-center text-gray-500">Cargando...</td></tr>';

    try {
        const res = await fetch('../../backend/public/api/admin/gestion.php');
        const json = await res.json();

        if (!json.success) {
            const mensaje = Object.values(json.errores || {}).join(', ') || 'No se pudo cargar la información';
            tablaDeportes.innerHTML = `<tr><td colspan="2" class="py-6 text-center text-red-400">${escaparHtml(mensaje)}</td></tr>`;
            tablaEjercicios.innerHTML = `<tr><td colspan="3" class="py-6 text-center text-red-400">${escaparHtml(mensaje)}</td></tr>`;
            return;
        }

        deportesData = json.data.deportes || [];
        ejerciciosData = json.data.ejercicios || [];
        renderDeportes();
        renderEjercicios();
    } catch (error) {
        tablaDeportes.innerHTML = '<tr><td colspan="2" class="py-6 text-center text-red-400">Error de conexión con el servidor</td></tr>';
        tablaEjercicios.innerHTML = '<tr><td colspan="3" class="py-6 text-center text-red-400">Error de conexión con el servidor</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('buscadorDeportes').addEventListener('input', renderDeportes);
    document.getElementById('buscadorEjercicios').addEventListener('input', renderEjercicios);
    cargarGestion();
});

// Mostrar nombre de usuario logueado en el sidebar usando fetch a PHP
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