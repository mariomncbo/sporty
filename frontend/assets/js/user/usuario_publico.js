// ── Menú usuario ──────────────────────────────────────────────────────
function toggleUserMenu(event) { event.stopPropagation(); document.getElementById('userMenu').classList.toggle('hidden'); }
document.addEventListener('click', function (e) {
    const menu = document.getElementById('userMenu');
    if (menu && !menu.classList.contains('hidden')) menu.classList.add('hidden');
});

// ── Tabs ─
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('text-white', 'border-[#00bf63]');
        b.classList.add('text-gray-400', 'border-transparent');
    });
    document.getElementById('content-' + tabId).classList.remove('hidden');
    const t = document.getElementById('tab-' + tabId);
    t.classList.add('text-white', 'border-[#00bf63]');
    t.classList.remove('text-gray-400', 'border-transparent');
}

// ── Cerrar sesión ─────────────────────────────────────────────────────
async function cerrarSesion(event) {
    event.preventDefault();
    try { await fetch('../../backend/public/api/auth/logout.php', { method: 'POST', credentials: 'include' }); } catch (_) {}
    window.location.href = '../auth/login.html';
}

// ── Modal detalle post ────
let _postIdActual = null;

function cerrarPost() {
    document.getElementById('modalPost').classList.add('hidden');
    document.body.style.overflow = '';
    _postIdActual = null;
}

function _renderComentario(c) {
    const noFoto = '../assets/img/no_user_profile.png';
    const div = document.createElement('div');
    div.className = 'flex items-start gap-3';
    div.innerHTML = `
        <img src="${c.foto_perfil || noFoto}" class="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10">
        <div>
            <span class="font-black text-white text-xs">${c.name || c.nickname}</span>
            <span class="text-gray-300 text-xs ml-2">${c.contenido}</span>
            <p class="text-gray-600 text-[10px] mt-1">${new Date(c.fecha).toLocaleDateString('es-ES', {day:'numeric',month:'short',year:'numeric'})}</p>
        </div>`;
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
            data.comentarios.forEach(c => panel.appendChild(_renderComentario(c)));
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
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contenido: texto })
        });
        const data = await res.json();
        if (data.success) {
            const panel = document.getElementById('modalPost_comentarios');
            const emptyMsg = panel.querySelector('p.text-gray-600');
            if (emptyMsg) emptyMsg.remove();
            panel.appendChild(_renderComentario(data.comentario));
            panel.scrollTop = panel.scrollHeight;
        }
    } catch (_) {}
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarPost(); });

// ── Modal unfollow ────────────────────────────────────────────────────
const modalUnfollow = document.getElementById('modal_unfollow');
function cerrarModalUnfollow() {
    modalUnfollow.classList.add('hidden');
    document.body.style.overflow = 'auto';
}
modalUnfollow.addEventListener('click', function (e) {
    if (e.target === this) cerrarModalUnfollow();
});

// ── Estado y lógica del botón seguir ─────────────────────────────────
const btnSeguir = document.getElementById('btn_seguir_action');
let estadoSeguir = 'no_siguiendo'; // 'no_siguiendo' | 'pendiente' | 'siguiendo'
let targetNick   = '';

// ── Botón Mensaje ─────────────────────────────────────────────────────────────
document.getElementById('btn_mensaje').addEventListener('click', async function () {
    if (!targetNick) return;
    this.disabled = true;
    try {
        const res  = await fetch('../../backend/public/api/auth/mensajes.php', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'iniciar', nick: targetNick }),
        });
        const data = await res.json();
        if (data.success) {
            window.location.href = `mensajes.html?conv=${data.id_conversacion}`;
        }
    } catch (_) {}
    this.disabled = false;
});

function actualizarBtnSeguir(estado) {
    estadoSeguir = estado;
    btnSeguir.classList.remove('bg-[#00bf63]', 'text-black', 'bg-gray-800', 'text-white', 'bg-yellow-500/20', 'text-yellow-300', 'border', 'border-yellow-500/30');

    if (estado === 'siguiendo') {
        btnSeguir.textContent = 'Siguiendo';
        btnSeguir.classList.add('bg-gray-800', 'text-white');
    } else if (estado === 'pendiente') {
        btnSeguir.textContent = 'Solicitud enviada';
        btnSeguir.classList.add('bg-yellow-500/20', 'text-yellow-300', 'border', 'border-yellow-500/30');
    } else {
        btnSeguir.textContent = 'Seguir';
        btnSeguir.classList.add('bg-[#00bf63]', 'text-black');
    }
}

btnSeguir.addEventListener('click', () => {
    if (estadoSeguir === 'siguiendo') {
        // Mostrar modal de confirmación para dejar de seguir
        document.getElementById('modal_unfollow_avatar').src =
            document.getElementById('public_user_avatar').src;
        modalUnfollow.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else if (estadoSeguir === 'pendiente') {
        // Cancelar la solicitud enviada
        accionSeguir('cancelar_solicitud');
    } else {
        accionSeguir('seguir');
    }
});

document.getElementById('btn_confirmar_unfollow').addEventListener('click', () => {
    accionSeguir('dejar_seguir');
    cerrarModalUnfollow();
});

async function accionSeguir(accion) {
    btnSeguir.disabled = true;
    try {
        const res  = await fetch('../../backend/public/api/auth/usuario_publico.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion, user: targetNick })
        });
        const data = await res.json();
        if (data.success) {
            const nuevoEstado = data.siguiendo ? 'siguiendo' : (data.solicitud_pendiente ? 'pendiente' : 'no_siguiendo');
            actualizarBtnSeguir(nuevoEstado);
            document.getElementById('public_user_followers_count').textContent = data.seguidores;

            // Mostrar/ocultar contenido privado si cambia el estado de seguimiento
            const privMsg = document.getElementById('private_account_msg');
            if (privMsg) {
                if (nuevoEstado === 'siguiendo') {
                    privMsg.classList.add('hidden');
                    privMsg.classList.remove('flex');
                }
            }
        }
    } catch (_) {}
    finally { btnSeguir.disabled = false; }
}

// ── Carga inicial ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
    // Leer ?user= de la URL
    const params = new URLSearchParams(window.location.search);
    targetNick   = params.get('user') || '';

    if (!targetNick) {
        window.location.href = 'perfil.html';
        return;
    }

    try {
        const res  = await fetch(
            `../../backend/public/api/auth/usuario_publico.php?user=${encodeURIComponent(targetNick)}`,
            { credentials: 'include' }
        );

        if (!res.ok) { window.location.href = '../auth/login.html'; return; }

        const data = await res.json();
        if (!data.success) { window.location.href = '../auth/login.html'; return; }

        // Si es el propio perfil, redirigir
        if (data.es_propio) {
            window.location.href = 'perfil.html';
            return;
        }

        // ── Aside / nav móvil (usuario en sesión) ────────────────────
        const yo   = data.yo;
        const fotoYo = yo.foto_perfil || '../assets/img/no_user_profile.png';
        document.getElementById('foto_user_aside').src             = fotoYo;
        document.getElementById('nombre_user_aside').textContent   = yo.name || yo.nickname;
        document.getElementById('username_user_aside').textContent = '@' + yo.nickname;
        const mobileNav = document.getElementById('foto_user_mobile_nav');
        if (mobileNav) mobileNav.src = fotoYo;

        // Cerrar sesión
        document.querySelectorAll('a[href="../auth/login.html"]').forEach(a => {
            if (a.textContent.trim().toLowerCase().includes('cerrar')) {
                a.href = '#';
                a.addEventListener('click', cerrarSesion);
            }
        });

        // ── Datos del perfil visitado ─────────────────────────────────
        const u    = data.usuario;
        const foto = u.foto_perfil || '../assets/img/no_user_profile.png';

        document.title = u.name + ' (@' + u.nickname + ') - Sporty';
        document.getElementById('public_user_avatar').src            = foto;
        document.getElementById('public_user_name').textContent      = u.name || u.nickname;
        document.getElementById('public_user_username').textContent  = '@' + u.nickname;
        document.getElementById('public_user_bio').textContent       = u.bio || '';
        document.getElementById('public_user_followers_count').textContent = u.total_seguidores ?? 0;
        document.getElementById('public_user_following_count').textContent = u.total_seguidos   ?? 0;
        document.getElementById('public_user_posts_count').textContent     = u.total_posts      ?? 0;

        // Website
        if (u.website) {
            const bioEl = document.getElementById('public_user_bio');
            const webEl = document.createElement('a');
            webEl.href      = u.website;
            webEl.target    = '_blank';
            webEl.rel       = 'noopener noreferrer';
            webEl.className = 'text-[#00bf63] text-sm font-semibold hover:underline mt-1 inline-flex items-center gap-1';
            webEl.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg><span>${u.website.replace(/^https?:\/\//, '')}</span>`;
            bioEl.insertAdjacentElement('afterend', webEl);
        }

        // Badge verificado
        if (parseInt(u.verificado) === 1) {
            document.getElementById('public_user_verified_badge').classList.remove('hidden');
        }

        // Estado inicial del botón seguir
        const estadoInicial = parseInt(u.yo_le_sigo) === 1 ? 'siguiendo'
                            : (parseInt(u.solicitud_pendiente) === 1 ? 'pendiente' : 'no_siguiendo');
        actualizarBtnSeguir(estadoInicial);

        // Cuenta privada: mostrar mensaje si no puede ver el contenido
        const privMsg = document.getElementById('private_account_msg');
        if (privMsg && data.cuenta_privada && !data.mostrar_contenido) {
            privMsg.classList.remove('hidden');
            privMsg.classList.add('flex');
        }

        // Anillo de historia en el avatar si hay historias activas
        if (data.historias && data.historias.length > 0) {
            const wrap = document.getElementById('public_user_avatar_wrap');
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

        // ── Grid de fotos ─────────────────────────────────────────────
        const gridFotos   = document.getElementById('grid_public_fotos');
        const emptyFotos  = document.getElementById('empty_state_fotos');
        const posts       = Array.isArray(data.posts) ? data.posts : [];

        if (!data.mostrar_contenido) {
            // Cuenta privada sin acceso: ocultar grid y empty state de fotos
            gridFotos.classList.add('hidden');
            emptyFotos.classList.add('hidden');
        } else if (posts.length > 0) {
            gridFotos.classList.remove('hidden');
            emptyFotos.classList.add('hidden');
            posts.forEach(p => {
                const item = document.createElement('div');
                item.className = 'aspect-square bg-[#111814] overflow-hidden cursor-pointer hover:opacity-80 transition-opacity rounded-sm';
                item.addEventListener('click', () => abrirPost(p.id_post));
                const img = document.createElement('img');
                img.src       = p.imagen;
                img.alt       = '';
                img.className = 'w-full h-full object-cover';
                item.appendChild(img);
                gridFotos.appendChild(item);
            });
        }

        // ── Grid de rutinas (cargado aparte con stats) ────────────────
        if (data.mostrar_contenido) {
            cargarRutinasPublicas(targetNick);
        } else {
            document.getElementById('empty_state_rutinas').classList.add('hidden');
        }

    } catch (e) {
        console.error('Error cargando perfil público:', e);
        window.location.href = '../auth/login.html';
    }
});

// ── Rutinas públicas ──────────────────────────────────────────────────────────
async function cargarRutinasPublicas(nick) {
    const gridRut  = document.getElementById('grid_public_rutinas');
    const emptyRut = document.getElementById('empty_state_rutinas');
    try {
        const res  = await fetch(`../../backend/public/api/auth/rutinas.php?user=${encodeURIComponent(nick)}`, { credentials: 'include' });
        const data = await res.json();
        if (!data.success || !data.rutinas.length) return;

        gridRut.classList.remove('hidden');
        emptyRut.classList.add('hidden');

        for (const r of data.rutinas) {
            const card = await renderRutinaPublica(r);
            gridRut.appendChild(card);
        }
    } catch (_) {}
}

async function renderRutinaPublica(r) {
    const card = document.createElement('div');
    card.id        = 'pub-routine-' + r.id_rutina;
    card.className = 'bg-[#111814] p-6 rounded-2xl border border-gray-800 w-full flex flex-col gap-4 h-[400px]';

    const likeActive = r.yo_le_di_like;
    const guardada   = r.yo_la_guarde;

    card.innerHTML = `
        <div class="min-w-0">
            <h3 class="text-lg font-black text-white truncate nombre-rutina"></h3>
            <p class="text-xs text-gray-500 mt-0.5 truncate desc-rutina"></p>
        </div>
        <ul class="lista-ejercicios space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
            <li class="text-[10px] text-gray-700 italic loading-ej">Cargando ejercicios…</li>
        </ul>
        <!-- Stats sociales -->
        <div class="flex items-center gap-4 text-[11px] font-black text-gray-500">
            <button class="btn-like flex items-center gap-1 hover:text-red-400 transition ${likeActive ? 'text-red-400' : ''}">
                <svg class="w-3.5 h-3.5" fill="${likeActive ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                <span class="likes-num">${r.likes_count}</span>
            </button>
            <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                <span class="guardadas-num">${r.guardadas_count}</span>
            </span>
            <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <span class="entrenos-num">${r.entrenamientos_count}</span>
            </span>
        </div>
        <!-- Acciones -->
        <div class="flex gap-2">
            <button class="btn-guardar flex-1 border font-black py-2.5 rounded-xl text-xs uppercase tracking-widest transition
                           ${guardada ? 'border-[#00bf63] text-[#00bf63]' : 'border-gray-700 text-gray-400 hover:border-[#00bf63] hover:text-[#00bf63]'}"
                    data-guardada="${guardada ? '1' : '0'}" data-rutina="${r.id_rutina}">
                ${guardada ? 'Guardada ✓' : 'Guardar'}
            </button>
            <button class="btn-entrenar-pub flex-1 bg-[#00bf63] text-black font-black py-2.5 rounded-xl text-xs uppercase tracking-widest hover:bg-[#00e070] transition"
                    data-rutina="${r.id_rutina}" data-nombre="${r.nombre}">
                Entrenar
            </button>
        </div>`;

    card.querySelector('.nombre-rutina').textContent = r.nombre;
    const descEl = card.querySelector('.desc-rutina');
    if (r.descripcion) descEl.textContent = r.descripcion; else descEl.classList.add('hidden');

    // Cargar ejercicios
    const listaEl = card.querySelector('.lista-ejercicios');
    _cargarEjerciciosPub(r.id_rutina, listaEl);

    // Like
    card.querySelector('.btn-like').addEventListener('click', async function () {
        try {
            const res  = await fetch('../../backend/public/api/auth/rutinas.php', {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: 'like', id_rutina: r.id_rutina }),
            });
            const data = await res.json();
            if (data.success) {
                card.querySelector('.likes-num').textContent = data.likes_count;
                const svg = this.querySelector('svg');
                if (data.liked) { this.classList.add('text-red-400'); svg.setAttribute('fill', 'currentColor'); }
                else            { this.classList.remove('text-red-400'); svg.setAttribute('fill', 'none'); }
            }
        } catch (_) {}
    });

    // Guardar (copiar)
    card.querySelector('.btn-guardar').addEventListener('click', async function () {
        if (this.dataset.guardada === '1') return; // ya guardada
        this.disabled = true;
        try {
            const res  = await fetch('../../backend/public/api/auth/rutinas.php', {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: 'guardar', id_rutina: r.id_rutina }),
            });
            const data = await res.json();
            if (data.success) {
                this.dataset.guardada = '1';
                this.textContent = 'Guardada ✓';
                this.classList.replace('border-gray-700', 'border-[#00bf63]');
                this.classList.replace('text-gray-400',  'text-[#00bf63]');
                card.querySelector('.guardadas-num').textContent = data.guardadas_count;
            }
        } catch (_) {}
        this.disabled = false;
    });

    // Entrenar
    card.querySelector('.btn-entrenar-pub').addEventListener('click', function () {
        _abrirEntrenamientoPub(r.id_rutina, r.nombre, card);
    });

    return card;
}

function _renderEjercicioPub(ej) {
    const li = document.createElement('li');
    li.className = 'flex items-center gap-3 bg-black/30 rounded-xl px-3 py-2';
    const pesoTxt = ej.peso_kg ? ` · ${ej.peso_kg} kg` : '';
    li.innerHTML = `
        <div class="min-w-0 flex-1">
            <p class="text-xs font-black text-white truncate">${ej.nombre}</p>
            <p class="text-[10px] text-gray-500 font-bold">${ej.series} series × ${ej.repeticiones} reps${pesoTxt}</p>
        </div>`;
    return li;
}

async function _cargarEjerciciosPub(idRutina, listaEl) {
    try {
        const res  = await fetch(`../../backend/public/api/auth/rutina_ejercicios.php?id_rutina=${idRutina}`, { credentials: 'include' });
        const data = await res.json();
        listaEl.innerHTML = '';
        if (!data.success || !data.ejercicios.length) {
            listaEl.innerHTML = '<li class="text-[10px] text-gray-700 italic">Sin ejercicios aún.</li>';
            return;
        }
        data.ejercicios.forEach(ej => listaEl.appendChild(_renderEjercicioPub(ej)));
    } catch (_) {
        listaEl.innerHTML = '';
    }
}

// ── Modal entrenamiento (página perfil público) ───────────────────────────────
let _timerPub         = null;
let _timerSecsPub     = 0;
let _rutinaPubId      = null;

function _abrirEntrenamientoPub(idRutina, nombre, card) {
    const ejercicios = [...card.querySelectorAll('.lista-ejercicios li')].map(li => ({
        nombre: li.querySelector('p:first-child')?.textContent || '',
        info:   li.querySelector('p:last-child')?.textContent  || '',
    })).filter(e => e.nombre);

    if (!ejercicios.length) { alert('Esta rutina no tiene ejercicios todavía.'); return; }

    _rutinaPubId = idRutina;

    const checklistEl = document.getElementById('pub_entrenamiento_checklist');
    checklistEl.innerHTML = '';
    ejercicios.forEach((ej, i) => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-3 p-3 bg-black/30 rounded-xl';
        div.innerHTML = `
            <input type="checkbox" id="pub_check_${i}" class="w-5 h-5 rounded accent-[#00bf63] cursor-pointer flex-shrink-0">
            <label for="pub_check_${i}" class="flex-1 cursor-pointer select-none">
                <p class="text-sm font-black text-white">${ej.nombre}</p>
                <p class="text-[10px] text-gray-500 font-bold">${ej.info}</p>
            </label>`;
        const cb = div.querySelector('input');
        cb.addEventListener('change', () => {
            div.classList.toggle('opacity-50', cb.checked);
            _comprobarCompletadoPub(ejercicios.length, card);
        });
        checklistEl.appendChild(div);
    });

    document.getElementById('pub_entrenamiento_nombre').textContent  = nombre;
    document.getElementById('pub_entrenamiento_timer').textContent   = '00:00';
    document.getElementById('pub_entrenamiento_fin').classList.add('hidden');
    checklistEl.classList.remove('hidden');
    document.getElementById('pub_entrenamiento_progreso').textContent = `0 / ${ejercicios.length}`;
    document.getElementById('modalEntrenamientoPub').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    _timerSecsPub = 0;
    if (_timerPub) clearInterval(_timerPub);
    _timerPub = setInterval(() => {
        _timerSecsPub++;
        const m = String(Math.floor(_timerSecsPub / 60)).padStart(2, '0');
        const s = String(_timerSecsPub % 60).padStart(2, '0');
        document.getElementById('pub_entrenamiento_timer').textContent = `${m}:${s}`;
    }, 1000);
}

function _comprobarCompletadoPub(total, card) {
    const checks      = document.querySelectorAll('#pub_entrenamiento_checklist input[type=checkbox]');
    const completados = [...checks].filter(c => c.checked).length;
    document.getElementById('pub_entrenamiento_progreso').textContent = `${completados} / ${total}`;
    if (completados === total) {
        clearInterval(_timerPub);
        document.getElementById('pub_entrenamiento_checklist').classList.add('hidden');
        document.getElementById('pub_entrenamiento_fin').classList.remove('hidden');
        const t = document.getElementById('pub_entrenamiento_timer').textContent;
        document.getElementById('pub_entrenamiento_tiempo_final').textContent = t;

        if (_rutinaPubId) {
            fetch('../../backend/public/api/auth/rutinas.php', {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: 'entreno', id_rutina: _rutinaPubId, duracion_segs: _timerSecsPub }),
            }).then(r => r.json()).then(data => {
                if (data.success && card) {
                    const num = card.querySelector('.entrenos-num');
                    if (num) num.textContent = data.entrenamientos_count;
                }
            }).catch(() => {});
        }
    }
}

function cerrarModalEntrenamientoPub() {
    clearInterval(_timerPub);
    _timerPub = null;
    document.getElementById('modalEntrenamientoPub').classList.add('hidden');
    document.body.style.overflow = '';
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
