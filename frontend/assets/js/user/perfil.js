// ── Menú de usuario ──────────────────────────────────────────────────────────
function toggleUserMenu(event) {
    event.stopPropagation();
    document.getElementById('userMenu').classList.toggle('hidden');
}
document.addEventListener('click', function () {
    const menu = document.getElementById('userMenu');
    if (menu && !menu.classList.contains('hidden')) menu.classList.add('hidden');
});

// ── Tabs ────────
let _guardadosCargados = false;

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('text-white', 'border-[#00bf63]');
        b.classList.add('text-gray-400', 'border-transparent');
    });
    document.getElementById('content-' + tabId).classList.remove('hidden');
    const activeTab = document.getElementById('tab-' + tabId);
    activeTab.classList.add('text-white', 'border-[#00bf63]');
    activeTab.classList.remove('text-gray-400', 'border-transparent');

    if (tabId === 'guardados' && !_guardadosCargados) {
        _guardadosCargados = true;
        cargarGuardados();
    }
}

// ── Modal de rutinas ─────────────────────────────────────────────────────────
function closeModal() { document.getElementById('modal-routine').classList.add('hidden'); }

function renderRutina(rutina) {
    const rutinasList = document.getElementById('rutinas-list');
    const addBtn      = document.getElementById('add-routine-card');
    const card = document.createElement('div');
    card.id        = 'routine-' + rutina.id_rutina;
    card.className = 'bg-[#111814] p-6 rounded-2xl border border-gray-800 relative group w-full flex flex-col gap-4 h-[400px]';
    card.innerHTML = `
        <div class="flex justify-between items-start">
            <div class="min-w-0">
                <h3 class="text-lg font-black text-white truncate"></h3>
                <p class="text-xs text-gray-500 mt-0.5 truncate desc-rutina"></p>
            </div>
            <button class="btn-delete-rutina text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3" data-id="${rutina.id_rutina}">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
        </div>
        <ul class="lista-ejercicios space-y-2 flex-1 min-h-0 overflow-y-auto pr-1"></ul>
        <button class="btn-add-ejercicio flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-[#00bf63] transition w-fit"
                data-rutina="${rutina.id_rutina}">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Añadir ejercicio
        </button>
        <!-- Stats sociales -->
        <div class="flex items-center gap-4 text-[11px] font-black text-gray-500">
            <span class="stat-likes flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                <span class="likes-num">${rutina.likes_count ?? 0}</span>
            </span>
            <span class="stat-guardadas flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                <span class="guardadas-num">${rutina.guardadas_count ?? 0}</span>
            </span>
            <span class="stat-entrenos flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <span class="entrenos-num">${rutina.entrenamientos_count ?? 0}</span>
            </span>
        </div>
        <button class="btn-entrenar w-full bg-[#00bf63] text-black font-black py-2.5 rounded-xl text-xs uppercase tracking-widest hover:bg-[#00e070] transition"
                data-rutina="${rutina.id_rutina}" data-nombre="${rutina.nombre}">
            Entrenar
        </button>
    `;
    card.querySelector('h3').textContent = rutina.nombre;
    const descEl = card.querySelector('.desc-rutina');
    if (rutina.descripcion) descEl.textContent = rutina.descripcion;
    else descEl.classList.add('hidden');

    card.querySelector('.btn-delete-rutina').addEventListener('click', function () {
        deleteRoutine(parseInt(this.dataset.id));
    });
    card.querySelector('.btn-add-ejercicio').addEventListener('click', function () {
        abrirModalEjercicio(parseInt(this.dataset.rutina));
    });
    card.querySelector('.btn-entrenar').addEventListener('click', function () {
        abrirModalEntrenamiento(parseInt(this.dataset.rutina), this.dataset.nombre, card);
    });

    rutinasList.insertBefore(card, addBtn);

    // Cargar ejercicios existentes
    cargarEjercicios(rutina.id_rutina, card.querySelector('.lista-ejercicios'));
}

async function cargarRutinas() {
    try {
        const res  = await fetch('../../backend/public/api/auth/rutinas.php', { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.rutinas.length > 0) {
            data.rutinas.forEach(renderRutina);
        }
    } catch (e) {
        console.error('Error cargando rutinas:', e);
    }
}

async function createRoutine() {
    const nameInput = document.getElementById('input-routine-name');
    const descInput = document.getElementById('input-routine-desc');
    const name = nameInput.value.trim();
    const desc = descInput.value.trim();
    if (!name) return;

    const btnCrear = document.querySelector('#modal-routine button[onclick="createRoutine()"]');
    if (btnCrear) { btnCrear.disabled = true; btnCrear.textContent = 'Guardando...'; }

    try {
        const res  = await fetch('../../backend/public/api/auth/rutinas.php', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: name, descripcion: desc })
        });
        const data = await res.json();
        if (data.success) {
            renderRutina({ id_rutina: data.id_rutina, nombre: name, descripcion: desc });
            closeModal();
            nameInput.value = '';
            descInput.value = '';
        } else {
            alert(data.errores?.nombre || data.errores?.general || 'No se pudo guardar la rutina.');
        }
    } catch (e) {
        alert('Error de conexión con el servidor.');
    } finally {
        if (btnCrear) { btnCrear.disabled = false; btnCrear.textContent = 'Crear'; }
    }
}

async function deleteRoutine(id) {
    if (!confirm('¿Eliminar esta rutina?')) return;
    try {
        const res  = await fetch('../../backend/public/api/auth/rutinas.php', {
            method: 'DELETE', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_rutina: id })
        });
        const data = await res.json();
        if (data.success) {
            const el = document.getElementById('routine-' + id);
            if (el) el.remove();
        } else {
            alert(data.errores?.rutina || 'No se pudo eliminar la rutina.');
        }
    } catch (e) {
        alert('Error de conexión con el servidor.');
    }
}

// ── Cerrar sesión 
async function cerrarSesion(event) {
    event.preventDefault();
    try {
        await fetch('../../backend/public/api/auth/logout.php', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    window.location.href = '../auth/login.html';
}

// ── Modal detalle post ────────────────────────────────────────────────────────
let _postIdActual = null;let _miNick = '';
function cerrarPost() {
    document.getElementById('modalPost').classList.add('hidden');
    document.body.style.overflow = '';
    _postIdActual = null;
}

function _renderComentario(c, esPostMio = true) {
    const noFoto = '../assets/img/no_user_profile.png';
    const puedeEliminar = esPostMio || (c.nickname === _miNick);
    const div = document.createElement('div');
    div.className = 'flex items-start gap-3 group/com';
    div.innerHTML = `
        <img src="${c.foto_perfil || noFoto}" class="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10">
        <div class="flex-1 min-w-0">
            <span class="font-black text-white text-xs">${c.name || c.nickname}</span>
            <span class="text-gray-300 text-xs ml-2">${c.contenido}</span>
            <p class="text-gray-600 text-[10px] mt-1">${new Date(c.fecha).toLocaleDateString('es-ES', {day:'numeric',month:'short',year:'numeric'})}</p>
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

        const p      = data.post;
        const noFoto = '../assets/img/no_user_profile.png';

        document.getElementById('modalPost_img').src    = p.imagen || '';
        document.getElementById('modalPost_avatar').src = p.foto_perfil || noFoto;
        document.getElementById('modalPost_name').textContent = p.name || p.nickname;
        document.getElementById('modalPost_nick').textContent = '@' + p.nickname;

        panel.innerHTML = '';

        if (p.contenido) {
            const caption = document.createElement('div');
            caption.className = 'flex items-start gap-3';
            caption.innerHTML = `
                <img src="${p.foto_perfil || noFoto}" class="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10">
                <div>
                    <span class="font-black text-white text-xs">${p.name || p.nickname}</span>
                    <span class="text-gray-300 text-xs ml-2">${p.contenido}</span>
                </div>`;
            panel.appendChild(caption);
            const sep = document.createElement('div');
            sep.className = 'border-b border-white/5 my-2';
            panel.appendChild(sep);
        }

        if (data.comentarios.length === 0 && !p.contenido) {
            panel.innerHTML = '<p class="text-gray-600 text-xs text-center py-6">Sin comentarios todavía.</p>';
        } else {
            data.comentarios.forEach(c => panel.appendChild(_renderComentario(c, true)));
        }
    } catch (e) {
        panel.innerHTML = '<p class="text-red-400 text-xs text-center py-6">Error de conexión.</p>';
    }
}

async function enviarComentario() {
    if (!_postIdActual) return;
    const input = document.getElementById('modalPost_input');
    const texto = input.value.trim();
    if (!texto) return;
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
            const emptyMsg = panel.querySelector('p.text-gray-600');
            if (emptyMsg) emptyMsg.remove();
            panel.appendChild(_renderComentario(data.comentario, true));
            panel.scrollTop = panel.scrollHeight;
        }
    } catch (_) {}
}


// ── Borrar post / comentario ─────────────────────────────────────────────────
async function borrarPost(idPost, itemEl) {
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
            itemEl.remove();
            const cEl = document.getElementById('user_posts_count');
            if (cEl) cEl.textContent = Math.max(0, parseInt(cEl.textContent) - 1);
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
// ── Tab Guardados ─────────────────────────────────────────────────────────────
async function cargarGuardados() {
    const contenedor = document.getElementById('content-guardados');
    contenedor.innerHTML = '<p class="col-span-3 text-center text-gray-600 text-xs py-16">Cargando...</p>';

    try {
        const res  = await fetch('../../backend/public/api/auth/posts_guardados.php', { credentials: 'include' });
        const data = await res.json();

        contenedor.innerHTML = '';

        if (!data.success || !data.posts.length) {
            contenedor.innerHTML = `
                <div class="col-span-3 flex flex-col items-center justify-center py-20 text-center">
                    <div class="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-6">
                        <svg class="h-10 w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                    </div>
                    <p class="text-lg font-black text-white mb-1">Nada guardado todavía</p>
                    <p class="text-xs text-gray-500">Guarda publicaciones de otros usuarios para verlas aquí.</p>
                </div>`;
            return;
        }

        data.posts.forEach(p => {
            const item = document.createElement('div');
            item.className = 'aspect-square bg-[#111814] overflow-hidden cursor-pointer relative group rounded-sm';
            item.innerHTML = `
                <img src="${p.imagen}" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-2 opacity-0 group-hover:opacity-100">
                    <span class="text-[10px] font-black text-white truncate">@${p.nickname}</span>
                </div>`;
            item.addEventListener('click', () => abrirPost(parseInt(p.id_post)));
            contenedor.appendChild(item);
        });
    } catch (_) {
        contenedor.innerHTML = '<p class="col-span-3 text-center text-red-400 text-xs py-16">Error al cargar guardados.</p>';
    }
}

// ── Modal Seguidores / Seguidos ───────────────────────────────────────────────
let _tipoModalSocial = '';
const NO_FOTO_SOCIAL = '../assets/img/no_user_profile.png';

function cerrarModalSocial() {
    document.getElementById('modalSocial').classList.add('hidden');
    document.body.style.overflow = '';
}

async function abrirModalSocial(tipo) {
    _tipoModalSocial = tipo;
    const modal  = document.getElementById('modalSocial');
    const titulo = document.getElementById('modalSocialTitulo');
    const lista  = document.getElementById('modalSocialLista');

    titulo.textContent = tipo === 'seguidores' ? 'Seguidores' : 'Seguidos';
    lista.innerHTML    = '<p class="text-gray-500 text-xs text-center py-8">Cargando...</p>';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    try {
        const res  = await fetch(`../../backend/public/api/auth/perfil.php?lista=${tipo}`, { credentials: 'include' });
        const data = await res.json();
        lista.innerHTML = '';

        if (!data.success || data.usuarios.length === 0) {
            lista.innerHTML = '<p class="text-gray-600 text-xs text-center py-8">Sin ' + tipo + ' todavía.</p>';
            return;
        }

        data.usuarios.forEach(u => lista.appendChild(_renderFilaSocial(u, tipo)));
    } catch (_) {
        lista.innerHTML = '<p class="text-red-400 text-xs text-center py-8">Error al cargar.</p>';
    }
}

function _renderFilaSocial(u, tipo) {
    const row = document.createElement('div');
    row.id        = 'social-row-' + u.id_usuario;
    row.className = 'flex items-center justify-between gap-3 py-2 px-2 rounded-xl hover:bg-white/5 transition';

    const labelBtn = tipo === 'seguidores' ? 'Eliminar' : 'Dejar de seguir';

    row.innerHTML = `
        <a href="usuario_publico.html?user=${u.nickname}" class="flex items-center gap-3 min-w-0 flex-1" onclick="cerrarModalSocial()">
            <img src="${u.foto_perfil || NO_FOTO_SOCIAL}" alt="" class="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0">
            <div class="flex flex-col min-w-0">
                <span class="text-xs font-black text-white truncate">${u.name || u.nickname}</span>
                <span class="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">@${u.nickname}</span>
            </div>
        </a>
        <button class="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition shrink-0 btn-eliminar-social"
                data-id="${u.id_usuario}" data-tipo="${tipo}">
            ${labelBtn}
        </button>`;

    row.querySelector('.btn-eliminar-social').addEventListener('click', function () {
        eliminarSocial(this.dataset.tipo, parseInt(this.dataset.id), row);
    });

    return row;
}

async function eliminarSocial(tipo, id_usuario, rowEl) {
    const btn = rowEl.querySelector('.btn-eliminar-social');
    btn.disabled    = true;
    btn.textContent = '...';

    try {
        const res  = await fetch('../../backend/public/api/auth/perfil.php', {
            method: 'DELETE', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: tipo === 'seguidores' ? 'seguidor' : 'seguido', id_usuario })
        });
        const data = await res.json();
        if (data.success) {
            rowEl.remove();
            // Actualizar contador en el perfil
            const counterId = tipo === 'seguidores' ? 'user_followers_count' : 'user_following_count';
            const el = document.getElementById(counterId);
            if (el) el.textContent = Math.max(0, parseInt(el.textContent) - 1);

            const lista = document.getElementById('modalSocialLista');
            if (lista && lista.children.length === 0) {
                lista.innerHTML = '<p class="text-gray-600 text-xs text-center py-8">Sin ' + tipo + ' todavía.</p>';
            }
        } else {
            btn.disabled    = false;
            btn.textContent = tipo === 'seguidores' ? 'Eliminar' : 'Dejar de seguir';
        }
    } catch (_) {
        btn.disabled    = false;
        btn.textContent = tipo === 'seguidores' ? 'Eliminar' : 'Dejar de seguir';
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        cerrarModalSocial();
        cerrarPost();
    }
});

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

// ── Ejercicios de rutina ──────────────────────────────────────────────────────
async function cargarEjercicios(idRutina, listaEl) {
    try {
        const res  = await fetch(`../../backend/public/api/auth/rutina_ejercicios.php?id_rutina=${idRutina}`, { credentials: 'include' });
        const data = await res.json();
        if (!data.success) return;
        data.ejercicios.forEach(ej => listaEl.appendChild(_renderEjercicioCard(ej)));
    } catch (_) {}
}

function _renderEjercicioCard(ej) {
    const li = document.createElement('li');
    li.dataset.id = ej.id;
    li.className = 'flex items-center justify-between gap-3 bg-black/30 rounded-xl px-3 py-2 group/ej';
    const pesoTxt = ej.peso_kg ? ` · ${ej.peso_kg} kg` : '';
    li.innerHTML = `
        <div class="min-w-0 flex-1">
            <p class="text-xs font-black text-white truncate">${ej.nombre}</p>
            <p class="text-[10px] text-gray-500 font-bold">${ej.series} series × ${ej.repeticiones} reps${pesoTxt}</p>
        </div>
        <button class="btn-del-ej opacity-0 group-hover/ej:opacity-100 transition-opacity text-gray-600 hover:text-red-400 shrink-0 p-1">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>`;
    li.querySelector('.btn-del-ej').addEventListener('click', () => eliminarEjercicio(ej.id, li));
    return li;
}

async function eliminarEjercicio(id, liEl) {
    try {
        const res  = await fetch('../../backend/public/api/auth/rutina_ejercicios.php', {
            method: 'DELETE', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        const data = await res.json();
        if (data.success) liEl.remove();
    } catch (_) {}
}

// ── Modal añadir ejercicio ────────────────────────────────────────────────────
let _rutinaEjActual = null;

function abrirModalEjercicio(idRutina) {
    _rutinaEjActual = idRutina;
    document.getElementById('modalEjercicio').classList.remove('hidden');
    document.getElementById('ej_nombre').value = '';
    document.getElementById('ej_series').value = '3';
    document.getElementById('ej_reps').value   = '10';
    document.getElementById('ej_peso').value   = '';
    document.getElementById('ej_error').classList.add('hidden');
    setTimeout(() => document.getElementById('ej_nombre').focus(), 100);
}
function cerrarModalEjercicio() {
    document.getElementById('modalEjercicio').classList.add('hidden');
    _rutinaEjActual = null;
}

async function guardarEjercicio() {
    if (!_rutinaEjActual) return;
    const nombre = document.getElementById('ej_nombre').value.trim();
    const series = parseInt(document.getElementById('ej_series').value) || 3;
    const reps   = parseInt(document.getElementById('ej_reps').value)   || 10;
    const peso   = document.getElementById('ej_peso').value.trim();
    const errEl  = document.getElementById('ej_error');
    const btn    = document.getElementById('btn_guardar_ej');

    if (!nombre) { errEl.textContent = 'El nombre es obligatorio.'; errEl.classList.remove('hidden'); return; }
    errEl.classList.add('hidden');
    btn.disabled = true; btn.textContent = 'Guardando...';

    try {
        const res  = await fetch('../../backend/public/api/auth/rutina_ejercicios.php', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_rutina: _rutinaEjActual, nombre, series, repeticiones: reps, peso_kg: peso || null }),
        });
        const data = await res.json();
        if (data.success) {
            const card  = document.getElementById('routine-' + _rutinaEjActual);
            const lista = card?.querySelector('.lista-ejercicios');
            if (lista) lista.appendChild(_renderEjercicioCard(data.ejercicio));
            cerrarModalEjercicio();
        } else {
            errEl.textContent = 'Error al guardar.'; errEl.classList.remove('hidden');
        }
    } catch (_) {
        errEl.textContent = 'Error de conexión.'; errEl.classList.remove('hidden');
    } finally {
        btn.disabled = false; btn.textContent = 'Guardar';
    }
}

// ── Modal entrenamiento ───────────────────────────────────────────────────────
let _timerInterval     = null;
let _timerSecs         = 0;
let _rutinaEntrenandoId = null;

function abrirModalEntrenamiento(idRutina, nombre, card) {
    _rutinaEntrenandoId = idRutina;
    const ejercicios = [...card.querySelectorAll('.lista-ejercicios li')].map(li => ({
        id:     li.dataset.id,
        nombre: li.querySelector('p:first-child').textContent,
        info:   li.querySelector('p:last-child').textContent,
    }));

    if (ejercicios.length === 0) {
        alert('Añade al menos un ejercicio antes de entrenar.');
        return;
    }

    // Construir checklist
    const checklistEl = document.getElementById('entrenamiento_checklist');
    checklistEl.innerHTML = '';
    ejercicios.forEach((ej, i) => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-3 p-3 bg-black/30 rounded-xl group/check';
        div.innerHTML = `
            <input type="checkbox" id="check_ej_${i}" class="w-5 h-5 rounded accent-[#00bf63] cursor-pointer flex-shrink-0">
            <label for="check_ej_${i}" class="flex-1 cursor-pointer select-none">
                <p class="text-sm font-black text-white">${ej.nombre}</p>
                <p class="text-[10px] text-gray-500 font-bold">${ej.info}</p>
            </label>`;
        const cb = div.querySelector('input');
        cb.addEventListener('change', () => {
            div.classList.toggle('opacity-50', cb.checked);
            _comprobarCompletado(ejercicios.length);
        });
        checklistEl.appendChild(div);
    });

    document.getElementById('entrenamiento_nombre').textContent = nombre;
    document.getElementById('entrenamiento_timer').textContent  = '00:00';
    document.getElementById('entrenamiento_fin').classList.add('hidden');
    document.getElementById('entrenamiento_checklist').classList.remove('hidden');
    document.getElementById('entrenamiento_progreso').textContent = `0 / ${ejercicios.length}`;
    document.getElementById('modalEntrenamiento').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Iniciar cronómetro
    _timerSecs = 0;
    if (_timerInterval) clearInterval(_timerInterval);
    _timerInterval = setInterval(() => {
        _timerSecs++;
        const m = String(Math.floor(_timerSecs / 60)).padStart(2, '0');
        const s = String(_timerSecs % 60).padStart(2, '0');
        document.getElementById('entrenamiento_timer').textContent = `${m}:${s}`;
    }, 1000);
}

function _comprobarCompletado(total) {
    const checks      = document.querySelectorAll('#entrenamiento_checklist input[type=checkbox]');
    const completados = [...checks].filter(c => c.checked).length;
    document.getElementById('entrenamiento_progreso').textContent = `${completados} / ${total}`;
    if (completados === total) {
        clearInterval(_timerInterval);
        document.getElementById('entrenamiento_checklist').classList.add('hidden');
        document.getElementById('entrenamiento_fin').classList.remove('hidden');
        const t = document.getElementById('entrenamiento_timer').textContent;
        document.getElementById('entrenamiento_tiempo_final').textContent = t;

        // Registrar entreno en backend y actualizar contador en la card
        if (_rutinaEntrenandoId) {
            fetch('../../backend/public/api/auth/rutinas.php', {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: 'entreno', id_rutina: _rutinaEntrenandoId, duracion_segs: _timerSecs }),
            }).then(r => r.json()).then(data => {
                if (data.success) {
                    const card = document.getElementById('routine-' + _rutinaEntrenandoId);
                    if (card) {
                        const num = card.querySelector('.entrenos-num');
                        if (num) num.textContent = data.entrenamientos_count;
                    }
                }
            }).catch(() => {});
        }
    }
}

function cerrarModalEntrenamiento() {
    clearInterval(_timerInterval);
    _timerInterval = null;
    document.getElementById('modalEntrenamiento').classList.add('hidden');
    document.body.style.overflow = '';
}

// ── DOMContentLoaded ──────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
    const modal    = document.getElementById('modal-routine');
    const addBtn   = document.getElementById('add-routine-card');
    if (addBtn) addBtn.onclick = () => modal.classList.remove('hidden');

    document.getElementById('btn_ver_seguidores')?.addEventListener('click', () => abrirModalSocial('seguidores'));
    document.getElementById('btn_ver_seguidos')?.addEventListener('click',   () => abrirModalSocial('seguidos'));

    try {
        const res = await fetch('../../backend/public/api/auth/perfil.php', { credentials: 'include' });
        if (!res.ok) { window.location.href = '../auth/login.html'; return; }
        const data = await res.json();
        if (!data.success) { window.location.href = '../auth/login.html'; return; }

        const u    = data.usuario;
        const foto = u.foto_perfil || '../assets/img/no_user_profile.png';
        _miNick = u.nickname;

        document.getElementById('foto_user_aside').src             = foto;
        document.getElementById('nombre_user_aside').textContent   = u.name || u.nickname;
        document.getElementById('username_user_aside').textContent = '@' + u.nickname;
        const mobileNav = document.getElementById('foto_user_mobile_nav');
        if (mobileNav) mobileNav.src = foto;

        document.getElementById('user_avatar').src          = foto;
        document.getElementById('user_name').textContent    = u.name || u.nickname;
        document.getElementById('user_username').textContent = '@' + u.nickname;
        document.getElementById('user_bio').textContent     = u.bio || '';

        if (u.website) {
            const linkEl  = document.getElementById('user_website');
            const labelEl = document.getElementById('user_website_text');
            labelEl.textContent = u.website.replace(/^https?:\/\//, '');
            linkEl.href = u.website;
            linkEl.classList.remove('hidden');
        }

        document.getElementById('user_followers_count').textContent = u.total_seguidores ?? 0;
        document.getElementById('user_following_count').textContent = u.total_seguidos   ?? 0;
        document.getElementById('user_posts_count').textContent     = u.total_posts      ?? 0;

        if (parseInt(u.verificado) === 1) {
            document.getElementById('user_verified_badge').classList.remove('hidden');
        }

        // Anillo de historia en el avatar si hay historias activas
        if (data.historias && data.historias.length > 0) {
            const wrap = document.getElementById('user_avatar_wrap');
            if (wrap) {
                wrap.style.boxShadow = '0 0 0 3px #00bf63, 0 0 0 6px rgba(0,0,0,0.9)';
                wrap.style.cursor    = 'pointer';
                wrap.addEventListener('click', function () {
                    window.abrirHistorias([{
                        nickname:    u.nickname,
                        foto_perfil: u.foto_perfil,
                        historias:   data.historias
                    }], 0);
                });
            }
        }

        document.querySelectorAll('a[href="../auth/login.html"]').forEach(function (a) {
            if (a.textContent.trim().toLowerCase().includes('cerrar')) {
                a.href = '#';
                a.addEventListener('click', cerrarSesion);
            }
        });

        const fotosGrid      = document.getElementById('content-fotos');
        const posts          = Array.isArray(data.posts) ? data.posts : [];
        const postsConImagen = posts.filter(p => p.imagen);

        if (postsConImagen.length > 0) {
            postsConImagen.forEach(function (post) {
                const item = document.createElement('div');
                item.className = 'aspect-square bg-[#111814] overflow-hidden cursor-pointer hover:opacity-80 transition-opacity rounded-sm relative group';
                item.addEventListener('click', () => abrirPost(post.id_post));
                const img = document.createElement('img');
                img.src       = post.imagen;
                img.alt       = '';
                img.className = 'w-full h-full object-cover';
                item.appendChild(img);
                const delBtn = document.createElement('button');
                delBtn.className = 'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-red-400 rounded-full p-1.5 hover:bg-black z-10';
                delBtn.title = 'Eliminar publicación';
                delBtn.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`;
                delBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    borrarPost(post.id_post, item);
                });
                item.appendChild(delBtn);
                fotosGrid.appendChild(item);
            });
        } else {
            fotosGrid.classList.remove('grid', 'grid-cols-3', 'gap-1', 'md:gap-4');
            fotosGrid.innerHTML = `
                <div class="flex flex-col items-center justify-center text-center py-20 px-6 bg-[#111814] rounded-2xl border border-gray-800">
                    <div class="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-8">
                        <svg class="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                    </div>
                    <h2 class="text-2xl font-bold mb-3 text-white">Sin publicaciones</h2>
                    <p class="text-gray-400">Aún no has subido ninguna foto.</p>
                </div>`;
        }

        await cargarRutinas();

    } catch (e) {
        console.error('Error cargando perfil:', e);
        window.location.href = '../auth/login.html';
    }
});
