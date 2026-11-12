const NO_FOTO = 'https://ui-avatars.com/api/?background=111814&color=00bf63&bold=true&name=U';
let tipoPublicacion = 'post';

// ── Utilidades de tiempo ──────────────────────────────────────────────────────
function tiempoRelativo(fechaStr) {
    const diff = Math.floor((Date.now() - new Date(fechaStr)) / 1000);
    if (diff < 60)    return 'ahora';
    if (diff < 3600)  return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
}

// ── Textos y links por tipo de notificación ───────────────────────────────────
function infoNotificacion(n) {
    switch (n.tipo) {
        case 'solicitud_seguimiento':
            return {
                texto: 'quiere seguirte.',
                link:  `usuario_publico.html?user=${encodeURIComponent(n.emisor_nick)}`,
                icono: `<span class="flex items-center justify-center w-9 h-9 rounded-full bg-yellow-500/20 text-yellow-400 shrink-0">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </span>`,
                esSolicitud: true,
            };
        case 'nuevo_seguidor':
            return {
                texto: 'ha empezado a seguirte.',
                link:  `usuario_publico.html?user=${encodeURIComponent(n.emisor_nick)}`,
                icono: `<span class="flex items-center justify-center w-9 h-9 rounded-full bg-[#00bf63]/20 text-[#00bf63] shrink-0">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zm8-3a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V6zM6 13a6 6 0 0112 0v1H6v-1H0v-1a6 6 0 016-6z"/></svg>
                </span>`,
            };
        case 'nuevo_comentario':
            return {
                texto: 'ha comentado en tu publicación.',
                link:  n.id_referencia ? `inicio.html?post=${n.id_referencia}` : '#',
                icono: `<span class="flex items-center justify-center w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 shrink-0">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                </span>`,
            };
        case 'nuevo_mensaje':
            return {
                texto: 'te ha enviado un mensaje.',
                link:  'mensajes.html',
                icono: `<span class="flex items-center justify-center w-9 h-9 rounded-full bg-purple-500/20 text-purple-400 shrink-0">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </span>`,
            };
        default:
            return { texto: '', link: '#', icono: '' };
    }
}

// ── Renderizar lista ──────────────────────────────────────────────────────────
function renderizarNotificaciones(notificaciones) {
    const loading = document.getElementById('loadingNotif');
    const empty   = document.getElementById('emptyNotif');
    const lista   = document.getElementById('listaNotificaciones');

    loading.classList.add('hidden');

    if (!notificaciones.length) {
        empty.classList.remove('hidden');
        empty.classList.add('flex');
        return;
    }

    lista.classList.remove('hidden');
    lista.innerHTML = notificaciones.map(n => {
        const info  = infoNotificacion(n);
        const foto  = n.emisor_foto || NO_FOTO;
        const fondo = n.leida ? 'bg-[#0d0d0d]' : 'bg-[#0a1f14]';

        if (info.esSolicitud) {
            return `
            <div class="flex flex-col gap-3 p-4 rounded-2xl ${fondo} relative group" data-id="${n.id_notificacion}">
                <div class="flex items-center gap-4">
                    ${!n.leida ? '<span class="absolute left-2 top-4 w-2 h-2 rounded-full bg-yellow-400"></span>' : ''}
                    <img src="${foto}" alt="${n.emisor_nick}" class="w-11 h-11 rounded-full object-cover border border-white/10 shrink-0"
                         onerror="this.src='${NO_FOTO}'">
                    ${info.icono}
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold text-white truncate">
                            <span class="text-yellow-400">@${n.emisor_nick}</span>
                            <span class="text-gray-300 font-semibold"> ${info.texto}</span>
                        </p>
                        <p class="text-xs text-gray-500 mt-0.5">${tiempoRelativo(n.fecha)}</p>
                    </div>
                    <button onclick="eliminarNotificacion(event, ${n.id_notificacion})"
                            class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 shrink-0 p-1">
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <div class="flex gap-2 pl-14">
                    <button onclick="aceptarSolicitud(${n.id_notificacion}, ${n.id_emisor ?? 0})"
                            class="flex-1 bg-[#00bf63] text-black font-black text-xs py-2 rounded-xl uppercase tracking-widest hover:bg-[#00e070] transition">
                        Aceptar
                    </button>
                    <button onclick="rechazarSolicitud(${n.id_notificacion}, ${n.id_emisor ?? 0})"
                            class="flex-1 bg-gray-800 text-white font-black text-xs py-2 rounded-xl uppercase tracking-widest hover:bg-gray-700 transition">
                        Rechazar
                    </button>
                </div>
            </div>`;
        }

        return `
        <a href="${info.link}" class="flex items-center gap-4 p-4 rounded-2xl ${fondo} hover:bg-white/5 transition-colors relative group" data-id="${n.id_notificacion}">
            ${!n.leida ? '<span class="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#00bf63]"></span>' : ''}
            <img src="${foto}" alt="${n.emisor_nick}" class="w-11 h-11 rounded-full object-cover border border-white/10 shrink-0"
                 onerror="this.src='${NO_FOTO}'">
            ${info.icono}
            <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-white truncate">
                    <span class="text-[#00bf63]">@${n.emisor_nick}</span>
                    <span class="text-gray-300 font-semibold"> ${info.texto}</span>
                </p>
                <p class="text-xs text-gray-500 mt-0.5">${tiempoRelativo(n.fecha)}</p>
            </div>
            <button onclick="eliminarNotificacion(event, ${n.id_notificacion})"
                    class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400 shrink-0 p-1">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </a>`;
    }).join('');
}

// ── Eliminar notificación ──────────────────────────────────────────────────────
async function eliminarNotificacion(e, id) {
    e.preventDefault();
    e.stopPropagation();

    await fetch('../../backend/public/api/auth/notificaciones.php', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_notificacion: id }),
    });

    // Eliminar del DOM sin recargar
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.2s';
        setTimeout(() => {
            el.remove();
            _comprobarListaVacia();
        }, 200);
    }
}

// ── Aceptar solicitud de seguimiento ──────────────────────────────────────────
async function aceptarSolicitud(idNotif, idEmisor) {
    const el = document.querySelector(`[data-id="${idNotif}"]`);
    if (el) { el.style.opacity = '0.5'; el.style.pointerEvents = 'none'; }

    await fetch('../../backend/public/api/auth/notificaciones.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'aceptar_solicitud', id_emisor: idEmisor, id_notificacion: idNotif }),
    });

    if (el) {
        el.style.transition = 'opacity 0.2s';
        el.style.opacity = '0';
        setTimeout(() => {
            el.remove();
            _comprobarListaVacia();
        }, 200);
    }
}

// ── Rechazar solicitud de seguimiento ─────────────────────────────────────────
async function rechazarSolicitud(idNotif, idEmisor) {
    const el = document.querySelector(`[data-id="${idNotif}"]`);
    if (el) { el.style.opacity = '0.5'; el.style.pointerEvents = 'none'; }

    await fetch('../../backend/public/api/auth/notificaciones.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'rechazar_solicitud', id_emisor: idEmisor, id_notificacion: idNotif }),
    });

    if (el) {
        el.style.transition = 'opacity 0.2s';
        el.style.opacity = '0';
        setTimeout(() => {
            el.remove();
            _comprobarListaVacia();
        }, 200);
    }
}

function _comprobarListaVacia() {
    const lista = document.getElementById('listaNotificaciones');
    if (lista && !lista.children.length) {
        lista.classList.add('hidden');
        const empty = document.getElementById('emptyNotif');
        if (empty) { empty.classList.remove('hidden'); empty.classList.add('flex'); }
    }
}

// ── Modal publicar (igual que las demás páginas) ──────────────────────────────
function abrirModalPublicar()  { document.getElementById('modalPublicar').classList.remove('hidden'); }
function cerrarModalPublicar() { document.getElementById('modalPublicar').classList.add('hidden'); }
function toggleUserMenu(e) {
    e.stopPropagation();
    document.getElementById('userMenu').classList.toggle('hidden');
}
document.addEventListener('click', () => document.getElementById('userMenu')?.classList.add('hidden'));

function cambiarTipoPublicacion(tipo) {
    tipoPublicacion = tipo;
    const esPost = tipo === 'post';
    document.getElementById('btnTabPost').className     = `flex-1 py-2 rounded-xl text-sm font-black transition ${esPost  ? 'bg-[#00bf63] text-black' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`;
    document.getElementById('btnTabHistoria').className = `flex-1 py-2 rounded-xl text-sm font-black transition ${!esPost ? 'bg-[#00bf63] text-black' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`;
    document.getElementById('captionWrapper').classList.toggle('hidden', !esPost);
    document.getElementById('tituloModal').textContent = esPost ? 'Nueva publicación' : 'Nueva historia';
}

function previsualizarImagen(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url  = URL.createObjectURL(file);
    const zona = document.getElementById('zonaImagen');
    zona.innerHTML = `<img src="${url}" class="w-full h-full object-cover" alt="preview">`;
    zona.className = 'w-full h-40 rounded-2xl overflow-hidden';
}

async function enviarPublicacion() {
    const archivo  = document.getElementById('inputImagen').files[0];
    const caption  = document.getElementById('captionPost').value.trim();
    const errEl    = document.getElementById('errorPublicar');
    const btn      = document.getElementById('btnEnviarPublicacion');
    errEl.classList.add('hidden');
    if (!archivo) { errEl.textContent = 'Debes seleccionar una imagen.'; errEl.classList.remove('hidden'); return; }
    const formData = new FormData();
    formData.append('imagen', archivo);
    if (tipoPublicacion === 'post') formData.append('caption', caption);
    btn.disabled = true; btn.textContent = 'Publicando...';
    try {
        const endpoint = tipoPublicacion === 'post'
            ? '../../backend/public/api/auth/publicar_post.php'
            : '../../backend/public/api/auth/publicar_historia.php';
        const res  = await fetch(endpoint, { method: 'POST', body: formData, credentials: 'include' });
        const data = await res.json();
        if (data.success) { location.reload(); }
        else { errEl.textContent = data.message || 'Error al publicar.'; errEl.classList.remove('hidden'); }
    } catch (_) {
        errEl.textContent = 'Error de conexión con el servidor.';
        errEl.classList.remove('hidden');
    } finally { btn.disabled = false; btn.textContent = 'Publicar'; }
}

// ── Init ─────────
window.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión y cargar datos del usuario para el nav
    try {
        const resUser = await fetch('../../backend/public/api/auth/user.php', { credentials: 'include' });
        if (!resUser.ok) { window.location.href = '../auth/login.html'; return; }
        const dataUser = await resUser.json();
        if (!dataUser.success) { window.location.href = '../auth/login.html'; return; }

        const foto = dataUser.usuario?.foto_perfil || NO_FOTO;
        const nombre = dataUser.usuario?.name || dataUser.usuario?.nickname || '';
        const nick   = dataUser.usuario?.nickname || '';

        const fotoAside  = document.getElementById('foto_user_aside');
        const fotoMobile = document.getElementById('foto_user_mobile_nav');
        if (fotoAside)  fotoAside.src  = foto;
        if (fotoMobile) fotoMobile.src = foto;

        const nombreEl = document.getElementById('nombre_user_aside');
        const nickEl   = document.getElementById('username_user_aside');
        if (nombreEl) nombreEl.textContent = nombre;
        if (nickEl)   nickEl.textContent   = '@' + nick;
    } catch (_) {
        window.location.href = '../auth/login.html';
        return;
    }

    // Cargar notificaciones
    try {
        const res  = await fetch('../../backend/public/api/auth/notificaciones.php', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
            renderizarNotificaciones(data.notificaciones || []);
        } else {
            document.getElementById('loadingNotif').classList.add('hidden');
            document.getElementById('emptyNotif').classList.remove('hidden');
            document.getElementById('emptyNotif').classList.add('flex');
        }
    } catch (_) {
        document.getElementById('loadingNotif').classList.add('hidden');
        document.getElementById('emptyNotif').classList.remove('hidden');
        document.getElementById('emptyNotif').classList.add('flex');
    }
});
