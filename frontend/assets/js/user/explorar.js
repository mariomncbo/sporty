// ── Menú usuario ──────────────────────────────────────────────────────
function toggleUserMenu(event) { event.stopPropagation(); document.getElementById('userMenu').classList.toggle('hidden'); }
document.addEventListener('click', function (e) {
    document.getElementById('userMenu')?.classList.add('hidden');
    if (!e.target.closest('#input_buscar') && !e.target.closest('#dropdown_busqueda')) {
        cerrarDropdown();
    }
});

// ── Constantes de colores por deporte ────────────────────────────────
const SPORT_COLORS = [
    'from-green-900 to-black border-green-800',
    'from-blue-900 to-black border-blue-800',
    'from-orange-900 to-black border-orange-800',
    'from-purple-900 to-black border-purple-800',
    'from-red-900 to-black border-red-800',
    'from-yellow-900 to-black border-yellow-800',
    'from-teal-900 to-black border-teal-800',
    'from-pink-900 to-black border-pink-800',
];

const SPORT_EMOJIS = {
    'fútbol': '⚽', 'baloncesto': '🏀', 'tenis': '🎾', 'natación': '🏊',
    'crossfit': '🏋️', 'calistenia': '💪', 'yoga': '🧘', 'pádel': '🏓'
};

function sportEmoji(nombre) {
    return SPORT_EMOJIS[nombre.toLowerCase()] || '🏅';
}

// ── Helpers de tarjeta ────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function tarjetaUsuario(u) {
    const foto  = u.foto_perfil || '../assets/img/no_user_profile.png';
    const badge = parseInt(u.verificado) === 1
        ? `<span class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#00bf63] rounded-full border-2 border-black flex items-center justify-center">
               <svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
           </span>` : '';
    const etiqueta = parseInt(u.entrenador) === 1
        ? `<span class="text-[8px] bg-[#00bf63]/20 text-[#00bf63] border border-[#00bf63]/30 rounded-full px-2 py-0.5 font-black uppercase tracking-widest">Coach</span>`
        : '';
    const deporteTag = u.deporte
        ? `<p class="text-[9px] text-gray-600 font-bold uppercase tracking-widest truncate">${u.deporte}</p>` : '';

    return `
        <a href="usuario_publico.html?user=${encodeURIComponent(u.nickname)}"
           class="bg-[#111814] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center hover:border-[#00bf63]/50 hover:bg-[#111814]/80 transition-all group cursor-pointer">
            <div class="relative mb-3">
                <img src="${foto}" alt="" class="w-14 h-14 rounded-full object-cover border-2 border-white/10 group-hover:border-[#00bf63] transition-colors">
                ${badge}
            </div>
            <p class="text-xs font-black text-white truncate w-full group-hover:text-[#00bf63] transition-colors">${escapeHtml(u.name || u.nickname)}</p>
            <p class="text-[10px] text-gray-500 font-bold truncate w-full mb-1">@${escapeHtml(u.nickname)}</p>
            ${etiqueta}
            ${deporteTag}
            <p class="text-[9px] text-gray-600 mt-1 font-bold">${u.seguidores ?? 0} seguidores</p>
        </a>`;
}

// ── Cerrar sesión ─────────────────────────────────────────────────────
async function cerrarSesion(event) {
    event.preventDefault();
    try { await fetch('../../backend/public/api/auth/logout.php', { method: 'POST', credentials: 'include' }); } catch (_) {}
    window.location.href = '../auth/login.html';
}

// ── Dropdown de búsqueda ──────────────────────────────────────────────
function cerrarDropdown() {
    const dropdown = document.getElementById('dropdown_busqueda');
    dropdown.classList.add('hidden');
    dropdown.innerHTML = '';
}

function mostrarResultadosBusqueda(usuarios, q) {
    const dropdown = document.getElementById('dropdown_busqueda');
    dropdown.innerHTML = '';
    if (usuarios.length === 0) {
        dropdown.innerHTML = `<div class="px-6 py-5 text-sm text-gray-500 font-bold italic text-center">Sin resultados para "<span class="text-white">${escapeHtml(q)}</span>"</div>`;
        dropdown.classList.remove('hidden');
        return;
    }
    usuarios.forEach(u => {
        const foto  = u.foto_perfil || '../assets/img/no_user_profile.png';
        const badge = parseInt(u.verificado) === 1
            ? `<svg class="w-3.5 h-3.5 text-[#00bf63] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>` : '';
        const coach = parseInt(u.entrenador) === 1
            ? `<span class="text-[9px] bg-[#00bf63]/20 text-[#00bf63] border border-[#00bf63]/30 rounded-full px-1.5 py-0.5 font-black uppercase">Coach</span>` : '';

        const item = document.createElement('a');
        item.href = `usuario_publico.html?user=${encodeURIComponent(u.nickname)}`;
        item.className = 'flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition-colors';
        item.innerHTML = `
            <img src="${foto}" alt="" class="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                    <p class="text-sm font-black text-white truncate">${escapeHtml(u.name || u.nickname)}</p>
                    ${badge}${coach}
                </div>
                <p class="text-[11px] text-gray-500 font-bold">@${escapeHtml(u.nickname)}</p>
            </div>
            <p class="text-[10px] text-gray-600 font-bold shrink-0">${u.seguidores ?? 0} seg.</p>`;
        dropdown.appendChild(item);
    });
    dropdown.classList.remove('hidden');
}

// ── Modal Publicar ────────────────────────────────────────────────────
let tipoPublicacion = null;
function abrirModalPublicar() {
    document.getElementById('modalPublicar').classList.remove('hidden');
    document.getElementById('modalPaso1').classList.remove('hidden');
    document.getElementById('modalPaso2').classList.add('hidden');
    document.getElementById('inputImagen').value = '';
    document.getElementById('captionPost').value = '';
    document.getElementById('errorPublicar').classList.add('hidden');
    reiniciarZonaImagen();
}
function cerrarModalPublicar() { document.getElementById('modalPublicar').classList.add('hidden'); }
function elegirTipo(tipo) {
    tipoPublicacion = tipo;
    document.getElementById('modalPaso1').classList.add('hidden');
    document.getElementById('modalPaso2').classList.remove('hidden');
    document.getElementById('modalTitulo').textContent = tipo === 'post' ? 'Nuevo Post' : 'Nueva Historia';
    document.getElementById('captionPost').classList.toggle('hidden', tipo === 'historia');
}
function volverPaso1() {
    document.getElementById('modalPaso1').classList.remove('hidden');
    document.getElementById('modalPaso2').classList.add('hidden');
}
function reiniciarZonaImagen() {
    const zona = document.getElementById('zonaImagen');
    zona.innerHTML = `<svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg><span class="text-xs font-bold uppercase tracking-widest">Elige o arrastra una imagen</span>`;
    zona.className = 'w-full h-40 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-[#00bf63]/50 hover:text-[#00bf63]/70 transition-all overflow-hidden';
}
function previsualizarImagen(event) {
    const file = event.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const zona = document.getElementById('zonaImagen');
    zona.innerHTML = `<img src="${url}" class="w-full h-full object-cover" alt="preview">`;
    zona.className = 'w-full h-40 rounded-2xl overflow-hidden';
}
async function enviarPublicacion() {
    const archivo = document.getElementById('inputImagen').files[0];
    const caption = document.getElementById('captionPost').value.trim();
    const errEl   = document.getElementById('errorPublicar');
    const btn     = document.getElementById('btnEnviarPublicacion');
    errEl.classList.add('hidden');
    if (!archivo) { errEl.textContent = 'Debes seleccionar una imagen.'; errEl.classList.remove('hidden'); return; }
    const formData = new FormData();
    formData.append('imagen', archivo);
    formData.append('tipo', tipoPublicacion);
    if (tipoPublicacion === 'post') formData.append('caption', caption);
    btn.disabled = true; btn.textContent = 'Publicando...';
    try {
        const endpoint = tipoPublicacion === 'post'
            ? '../../backend/public/api/auth/publicar_post.php'
            : '../../backend/public/api/auth/publicar_historia.php';
        const res  = await fetch(endpoint, { method: 'POST', body: formData, credentials: 'include' });
        const data = await res.json();
        if (data.success) { cerrarModalPublicar(); }
        else { errEl.textContent = data.message || 'Error al publicar.'; errEl.classList.remove('hidden'); }
    } catch (e) {
        errEl.textContent = 'Error de conexión con el servidor.';
        errEl.classList.remove('hidden');
    } finally { btn.disabled = false; btn.textContent = 'Publicar'; }
}

// ── Vista de deporte ──────────────────────────────────────────────────
function volverAExplorar() {
    document.getElementById('vista_deporte').classList.add('hidden');
    document.getElementById('contenido_explorar').classList.remove('hidden');
}

async function mostrarDeporte(idDeporte, nombreDeporte) {
    document.getElementById('contenido_explorar').classList.add('hidden');
    document.getElementById('vista_deporte').classList.remove('hidden');
    document.getElementById('titulo_deporte').textContent = nombreDeporte;

    const grid  = document.getElementById('grid_deporte');
    const vacio = document.getElementById('deporte_vacio');
    grid.innerHTML  = '<p class="col-span-full text-center text-gray-600 py-10 font-bold italic animate-pulse">Cargando...</p>';
    vacio.classList.add('hidden');

    try {
        const res  = await fetch(`../../backend/public/api/auth/explorar.php?deporte=${idDeporte}`, { credentials: 'include' });
        const data = await res.json();
        grid.innerHTML = '';
        if (data.success && data.usuarios.length > 0) {
            data.usuarios.forEach(u => {
                const d = { ...u, deporte: null };
                grid.insertAdjacentHTML('beforeend', tarjetaUsuario(d));
            });
        } else {
            vacio.classList.remove('hidden');
        }
    } catch (_) {
        grid.innerHTML = '<p class="col-span-full text-center text-red-400 py-10 font-bold italic">Error al cargar.</p>';
    }
}

// ── DOMContentLoaded ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
    const btnLimpiar = document.getElementById('btn_limpiar_busqueda');
    let debounceTimer = null;

    document.getElementById('input_buscar').addEventListener('input', function () {
        const q = this.value.trim();
        btnLimpiar.classList.toggle('hidden', q === '');
        clearTimeout(debounceTimer);
        if (q === '') { cerrarDropdown(); return; }
        debounceTimer = setTimeout(async () => {
            try {
                const res  = await fetch(`../../backend/public/api/auth/explorar.php?q=${encodeURIComponent(q)}`, { credentials: 'include' });
                const data = await res.json();
                if (data.success) mostrarResultadosBusqueda(data.usuarios, q);
            } catch (_) {}
        }, 280);
    });

    btnLimpiar.addEventListener('click', function () {
        const inp = document.getElementById('input_buscar');
        inp.value = '';
        inp.focus();
        btnLimpiar.classList.add('hidden');
        cerrarDropdown();
    });

    document.getElementById('btn_volver_explorar').addEventListener('click', volverAExplorar);

    try {
        const res  = await fetch('../../backend/public/api/auth/explorar.php', { credentials: 'include' });
        if (!res.ok) { window.location.href = '../auth/login.html'; return; }
        const data = await res.json();
        if (!data.success) { window.location.href = '../auth/login.html'; return; }

        const foto = data.yo?.foto_perfil || '../assets/img/no_user_profile.png';
        document.getElementById('foto_user_aside').src             = foto;
        document.getElementById('nombre_user_aside').textContent   = data.yo?.name || data.yo?.nickname || '';
        document.getElementById('username_user_aside').textContent = '@' + (data.yo?.nickname || '');
        const mobileNav = document.getElementById('foto_user_mobile_nav');
        if (mobileNav) mobileNav.src = foto;

        document.querySelectorAll('a[href="../auth/login.html"]').forEach(a => {
            if (a.textContent.trim().toLowerCase().includes('cerrar')) {
                a.href = '#';
                a.addEventListener('click', cerrarSesion);
            }
        });

        const gridCat = document.getElementById('grid_categorias');
        gridCat.innerHTML = '';
        (data.categorias || []).forEach((cat, i) => {
            const color = SPORT_COLORS[i % SPORT_COLORS.length];
            const emoji = sportEmoji(cat.nombre_deporte);
            const card  = document.createElement('button');
            card.type      = 'button';
            card.className = `bg-gradient-to-br ${color} border rounded-2xl p-5 flex flex-col items-start hover:scale-[1.02] transition-transform text-left w-full`;
            card.innerHTML = `
                <span class="text-2xl mb-3">${emoji}</span>
                <p class="text-sm font-black text-white leading-tight">${escapeHtml(cat.nombre_deporte)}</p>
                <p class="text-[10px] text-gray-400 font-bold mt-1">${cat.total_atletas} atleta${cat.total_atletas !== 1 ? 's' : ''}</p>`;
            card.addEventListener('click', () => mostrarDeporte(cat.id_deporte, cat.nombre_deporte));
            gridCat.appendChild(card);
        });

        const gridSug = document.getElementById('grid_sugerencias');
        gridSug.innerHTML = '';
        if ((data.sugerencias || []).length === 0) {
            gridSug.innerHTML = '<p class="col-span-full text-center text-gray-600 py-10 font-bold italic">Ya sigues a todos. ¡Explora por deporte!</p>';
        } else {
            data.sugerencias.forEach(u => {
                gridSug.insertAdjacentHTML('beforeend', tarjetaUsuario({ ...u, deporte: u.deporte }));
            });
        }

    } catch (e) {
        console.error('Error cargando explorar:', e);
        window.location.href = '../auth/login.html';
    }
});
