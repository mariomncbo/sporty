// ── Helpers ──────
const NO_FOTO = '../assets/img/no_user_profile.png';

function toggleUserMenu(event) { event.stopPropagation(); document.getElementById('userMenu').classList.toggle('hidden'); }
document.addEventListener('click', function() { document.getElementById('userMenu')?.classList.add('hidden'); });

function tiempoRelativo(fechaStr) {
    const diff = Math.floor((Date.now() - new Date(fechaStr)) / 1000);
    if (diff < 60)    return 'Ahora';
    if (diff < 3600)  return Math.floor(diff / 60) + ' min';
    if (diff < 86400) return Math.floor(diff / 3600) + ' h';
    if (diff < 604800) return Math.floor(diff / 86400) + ' d';
    return new Date(fechaStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ── Modal post ───
let _postIdActual   = null;
let _postOwnerNick  = null;

function cerrarPost() {
    document.getElementById('modalPost').classList.add('hidden');
    document.body.style.overflow = '';
    _postIdActual = null;
}

function _renderComentario(c, esPostMio = false) {
    const puedeEliminar = esPostMio || (c.nickname === _miNick);
    const div = document.createElement('div');
    div.className = 'flex items-start gap-3 group/com';
    div.innerHTML = `
        <img src="${c.foto_perfil || NO_FOTO}" class="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10">
        <div class="flex-1 min-w-0">
            <span class="font-black text-white text-xs">${c.name || c.nickname}</span>
            <span class="text-gray-300 text-xs ml-2">${c.contenido}</span>
            <p class="text-gray-600 text-[10px] mt-1">${tiempoRelativo(c.fecha)}</p>
        </div>
        ${puedeEliminar ? `<button class="btn-del-com opacity-0 group-hover/com:opacity-100 transition-opacity text-gray-600 hover:text-red-400 shrink-0 p-1"><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>` : ''}`;
    if (puedeEliminar) {
        div.querySelector('.btn-del-com').addEventListener('click', () => borrarComentario(c.id_comentario, div));
    }
    return div;
}

async function abrirPost(idPost) {
    _postIdActual = idPost;
    document.getElementById('modalPost').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    const panel = document.getElementById('modalPost_comentarios');
    panel.innerHTML = '<p class="text-gray-500 text-xs text-center py-6">Cargando...</p>';
    try {
        const res  = await fetch(`../../backend/public/api/auth/post_detalle.php?id=${idPost}`, { credentials: 'include' });
        const data = await res.json();
        if (!data.success) { panel.innerHTML = '<p class="text-red-400 text-xs text-center py-6">Error al cargar.</p>'; return; }
        const p = data.post;
        _postOwnerNick = p.nickname;
        const esPostMio = p.nickname === _miNick;
        document.getElementById('modalPost_img').src    = p.imagen || '';
        document.getElementById('modalPost_avatar').src = p.foto_perfil || NO_FOTO;
        document.getElementById('modalPost_name').textContent = p.name || p.nickname;
        document.getElementById('modalPost_nick').textContent = '@' + p.nickname;
        panel.innerHTML = '';
        if (p.contenido) {
            const cap = document.createElement('div');
            cap.className = 'flex items-start gap-3';
            cap.innerHTML = `<img src="${p.foto_perfil || NO_FOTO}" class="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10">
                <div><span class="font-black text-white text-xs">${p.name || p.nickname}</span><span class="text-gray-300 text-xs ml-2">${p.contenido}</span></div>`;
            panel.appendChild(cap);
            const sep = document.createElement('div'); sep.className = 'border-b border-white/5 my-2'; panel.appendChild(sep);
        }
        if (!data.comentarios.length && !p.contenido) {
            panel.innerHTML = '<p class="text-gray-600 text-xs text-center py-6">Sin comentarios todavía.</p>';
        } else {
            data.comentarios.forEach(c => panel.appendChild(_renderComentario(c, esPostMio)));
        }
    } catch (_) { panel.innerHTML = '<p class="text-red-400 text-xs text-center py-6">Error de conexión.</p>'; }
}

async function enviarComentario() {
    if (!_postIdActual) return;
    const input = document.getElementById('modalPost_input');
    const texto = input.value.trim(); if (!texto) return;
    input.value = '';
    try {
        const res  = await fetch(`../../backend/public/api/auth/post_detalle.php?id=${_postIdActual}`, {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contenido: texto })
        });
        const data = await res.json();
        if (data.success) {
            const panel = document.getElementById('modalPost_comentarios');
            panel.querySelector('p.text-gray-600')?.remove();
            panel.appendChild(_renderComentario(data.comentario, _postOwnerNick === _miNick));
            panel.scrollTop = panel.scrollHeight;
        }
    } catch (_) {}
}

// ── Borrar post / comentario ─────────────────────────────────────────────────
async function borrarPost(idPost, artEl) {
    if (!confirm('¿Eliminar esta publicación?')) return;
    try {
        const res  = await fetch(`../../backend/public/api/auth/post_detalle.php?id=${idPost}`, {
            method: 'DELETE', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: 'post' }),
        });
        const data = await res.json();
        if (data.success) {
            if (_postIdActual === idPost) cerrarPost();
            artEl.style.opacity = '0';
            artEl.style.transition = 'opacity 0.2s';
            setTimeout(() => artEl.remove(), 200);
        }
    } catch (_) {}
}

async function borrarComentario(idComentario, divEl) {
    try {
        const res  = await fetch(`../../backend/public/api/auth/post_detalle.php?id=${_postIdActual}`, {
            method: 'DELETE', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: 'comentario', id_comentario: idComentario }),
        });
        const data = await res.json();
        if (data.success) {
            divEl.style.opacity = '0';
            divEl.style.transition = 'opacity 0.15s';
            setTimeout(() => divEl.remove(), 150);
        }
    } catch (_) {}
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarPost(); });

// ── Renderizado ──
function renderHistoria(grupo, grupoIdx) {
    const wrap = document.createElement('div');
    wrap.className = 'flex flex-col items-center gap-2 min-w-[70px] md:min-w-[80px] cursor-pointer';
    wrap.innerHTML = `
        <div class="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#00bf63] to-[#00e07a] shadow-[0_0_10px_rgba(0,191,99,0.25)]">
            <img src="${grupo.foto_perfil || NO_FOTO}" class="w-full h-full rounded-full object-cover bg-[#111814] border-2 border-black">
        </div>
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate w-full text-center">${grupo.nickname}</span>`;
    wrap.addEventListener('click', () => window.abrirHistorias(window._historias, grupoIdx));
    return wrap;
}



function renderPost(p) {
    const art = document.createElement('article');
    art.className = 'border-b border-white/5 pb-10 w-full';
    const nick = p.nickname;
    const nombre = p.name || nick;
    const foto = p.foto_perfil || NO_FOTO;
    const esPropio = nick === _miNick;
    const profileHref = esPropio ? 'perfil.html' : `usuario_publico.html?user=${nick}`;

    art.innerHTML = `
        <div class="flex items-center justify-between mb-4 px-2 w-full">
            <a href="${profileHref}" class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-[#111814] border border-white/10 overflow-hidden shrink-0">
                    <img src="${foto}" alt="" class="w-full h-full object-cover">
                </div>
                <div class="flex flex-col">
                    <span class="text-sm font-black italic tracking-tight text-white uppercase hover:text-[#00bf63] transition">${nombre}</span>
                    <span class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">${tiempoRelativo(p.fecha)}</span>
                </div>
            </a>
            ${esPropio ? `<button class="btn-del-post text-gray-600 hover:text-red-400 transition p-1" title="Eliminar publicación"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>` : ''}
        </div>
        <div class="bg-[#111814] rounded-3xl overflow-hidden border border-white/5 shadow-2xl w-full cursor-pointer" data-post-id="${p.id_post}">
            <img src="${p.imagen}" alt="" class="w-full aspect-square object-cover bg-black">
        </div>
        <div class="flex gap-5 mt-4 mb-3 px-2 w-full">
            <button class="hover:text-[#00bf63] transition uppercase text-xs font-black italic tracking-widest btn-comentar" data-post-id="${p.id_post}">Comentar</button>
            ${!esPropio ? `<button class="ml-auto btn-guardar-post transition p-1 ${p.yo_lo_guarde ? 'text-[#00bf63]' : 'text-gray-600 hover:text-[#00bf63]'}" data-guardado="${p.yo_lo_guarde ? '1' : '0'}" title="Guardar publicación">
                <svg class="w-4 h-4" fill="${p.yo_lo_guarde ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
            </button>` : ''}
        </div>
        <div class="text-sm px-2 mt-2 w-full">
            ${p.contenido ? `<p class="text-gray-300 leading-relaxed w-full"><span class="font-black text-white italic mr-2 uppercase">${nombre}</span>${p.contenido}</p>` : ''}
            ${p.total_comentarios > 0 ? `<p class="text-gray-500 text-xs mt-2 cursor-pointer hover:text-gray-400 btn-comentar" data-post-id="${p.id_post}">Ver los ${p.total_comentarios} comentario${p.total_comentarios > 1 ? 's' : ''}</p>` : ''}
        </div>`;

    if (esPropio) {
        art.querySelector('.btn-del-post').addEventListener('click', e => {
            e.stopPropagation();
            borrarPost(p.id_post, art);
        });
    }
    const btnGuardar = art.querySelector('.btn-guardar-post');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async function (e) {
            e.stopPropagation();
            try {
                const res  = await fetch('../../backend/public/api/auth/posts_guardados.php', {
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_post: p.id_post }),
                });
                const data = await res.json();
                if (data.success) {
                    const svg = this.querySelector('svg');
                    if (data.guardado) {
                        this.dataset.guardado = '1';
                        this.classList.replace('text-gray-600', 'text-[#00bf63]');
                        svg.setAttribute('fill', 'currentColor');
                    } else {
                        this.dataset.guardado = '0';
                        this.classList.replace('text-[#00bf63]', 'text-gray-600');
                        svg.setAttribute('fill', 'none');
                    }
                }
            } catch (_) {}
        });
    }
    art.querySelectorAll('[data-post-id]').forEach(el => {
        el.addEventListener('click', () => abrirPost(parseInt(el.dataset.postId)));
    });

    return art;
}

function renderSugerencia(s) {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between w-full';
    const subtitulo = s.entrenador ? 'Entrenador' : (s.nombre_deporte || 'Sugerido');
    div.innerHTML = `
        <a href="usuario_publico.html?user=${s.nickname}" class="flex items-center gap-3">
            <img src="${s.foto_perfil || NO_FOTO}" alt="" class="w-9 h-9 rounded-full bg-[#111814] border border-white/5 object-cover">
            <div class="flex flex-col">
                <span class="text-[11px] font-black uppercase italic tracking-tight text-white hover:text-[#00bf63] transition">${s.name || s.nickname}</span>
                <span class="text-[9px] text-gray-600 font-bold uppercase">${subtitulo}</span>
            </div>
        </a>
        <button class="text-[10px] font-black text-[#00bf63] uppercase tracking-widest hover:text-white transition btn-seguir">Seguir</button>`;
    div.querySelector('.btn-seguir').addEventListener('click', async function() {
        const siguiendo = this.dataset.siguiendo === '1';
        this.textContent = '...';
        this.disabled = true;
        try {
            const res  = await fetch('../../backend/public/api/auth/seguir.php', {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_usuario: s.id_usuario })
            });
            const data = await res.json();
            if (data.accion === 'dejado') {
                this.textContent = 'Seguir';
                this.dataset.siguiendo = '0';
                this.classList.replace('text-gray-500', 'text-[#00bf63]');
            } else {
                this.textContent = 'Siguiendo';
                this.dataset.siguiendo = '1';
                this.classList.replace('text-[#00bf63]', 'text-gray-500');
            }
        } catch (_) {
            this.textContent = siguiendo ? 'Siguiendo' : 'Seguir';
        } finally {
            this.disabled = false;
        }
    });
    return div;
}

// ── Variables globales de sesión ──────────────────────────────────────────────
let _miNick = '';

// ── Cerrar sesión 
async function cerrarSesion(event) {
    event.preventDefault();
    try { await fetch('../../backend/public/api/auth/logout.php', { method: 'POST', credentials: 'include' }); } catch (_) {}
    window.location.href = '../auth/login.html';
}

// ── Modal Publicar ────────────────────────────────────────────────────────────
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
        if (data.success) { location.reload(); }
        else { errEl.textContent = data.message || 'Error al publicar.'; errEl.classList.remove('hidden'); }
    } catch (e) {
        errEl.textContent = 'Error de conexión con el servidor.';
        errEl.classList.remove('hidden');
    } finally { btn.disabled = false; btn.textContent = 'Publicar'; }
}

// ── DOMContentLoaded ──────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const res  = await fetch('../../backend/public/api/auth/feed.php', { credentials: 'include' });
        if (!res.ok) { window.location.href = '../auth/login.html'; return; }
        const data = await res.json();
        if (!data.success) { window.location.href = '../auth/login.html'; return; }

        const yo   = data.yo;
        _miNick    = yo.nickname;
        const foto = yo.foto_perfil || NO_FOTO;

        document.getElementById('foto_user_aside').src             = foto;
        document.getElementById('foto_user_mobile_nav').src        = foto;
        document.getElementById('nombre_user_aside').textContent   = yo.name || yo.nickname;
        document.getElementById('username_user_aside').textContent = '@' + yo.nickname;
        document.querySelector('#userMenu a.text-red-500').addEventListener('click', cerrarSesion);

        document.getElementById('sidebar_user_avatar').src       = foto;
        document.getElementById('sidebar_username').textContent  = yo.nickname;
        document.getElementById('sidebar_user_name').textContent = yo.name || '';

        window._historias = data.historias;
        const contHistorias = document.getElementById('contenedor_historias');
        if (data.historias.length > 0) {
            data.historias.forEach((grupo, idx) => contHistorias.appendChild(renderHistoria(grupo, idx)));
        } else {
            contHistorias.classList.add('hidden');
        }

        const feed = document.getElementById('contenedor_feed');
        if (data.posts.length > 0) {
            data.posts.forEach(p => feed.appendChild(renderPost(p)));
        } else {
            feed.innerHTML = `<div class="flex flex-col items-center text-center py-20 gap-4">
                <div class="w-20 h-20 rounded-full bg-[#111814] border border-gray-800 flex items-center justify-center">
                    <svg class="h-10 w-10 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>
                </div>
                <p class="text-gray-600 font-bold text-sm uppercase tracking-widest">Sigue a alguien para ver sus posts aquí</p>
                <a href="explorar.html" class="text-[#00bf63] font-black text-xs uppercase tracking-widest hover:text-white transition">Explorar usuarios</a>
            </div>`;
        }

        const contSug = document.getElementById('contenedor_sugerencias');
        if (data.sugerencias.length > 0) {
            data.sugerencias.forEach(s => contSug.appendChild(renderSugerencia(s)));
        } else {
            contSug.innerHTML = '<p class="text-gray-700 text-xs uppercase font-bold">No hay sugerencias</p>';
        }

        // Abrir post directamente si venimos desde una notificación de comentario
        const postParam = new URLSearchParams(window.location.search).get('post');
        if (postParam) {
            abrirPost(parseInt(postParam, 10));
        }

    } catch (e) {
        console.error(e);
        window.location.href = '../auth/login.html';
    }
});
