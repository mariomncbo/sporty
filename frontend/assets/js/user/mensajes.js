const NO_FOTO = '../assets/img/no_user_profile.png';

// ── Estado global 
let _convActiva   = null;   // { id_conversacion, otro_usuario }
let _ultimoMsgId  = 0;
let _polling      = null;
let _todasConvs   = [];     // cache para filtrado local

// ── Menú usuario ─
function toggleUserMenu(event) {
    event.stopPropagation();
    document.getElementById('userMenu').classList.toggle('hidden');
}
document.addEventListener('click', () => {
    const menu = document.getElementById('userMenu');
    if (menu && !menu.classList.contains('hidden')) menu.classList.add('hidden');
});

// ── Cerrar sesión 
async function cerrarSesion(event) {
    event.preventDefault();
    try { await fetch('../../backend/public/api/auth/logout.php', { method: 'POST', credentials: 'include' }); } catch (_) {}
    window.location.href = '../auth/login.html';
}

// ── Helpers ──────
function tiempoRelativo(fechaStr) {
    const diff = Math.floor((Date.now() - new Date(fechaStr)) / 1000);
    if (diff < 60)   return 'ahora';
    if (diff < 3600) return Math.floor(diff / 60) + 'm';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    return Math.floor(diff / 86400) + 'd';
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Render: fila de conversación (panel izquierdo) ────────────────────────────
function renderChatRow(conv) {
    const u       = conv.otro_usuario;
    const foto    = u.foto_perfil || NO_FOTO;
    const ultimo  = conv.ultimo_mensaje;
    const preview = ultimo
        ? (ultimo.es_mio ? 'Tú: ' : '') + escapeHtml(ultimo.contenido.slice(0, 40)) + (ultimo.contenido.length > 40 ? '…' : '')
        : '<span class="italic">Sin mensajes aún</span>';
    const tiempo  = ultimo ? tiempoRelativo(ultimo.fecha) : '';

    const div = document.createElement('div');
    div.dataset.convId  = conv.id_conversacion;
    div.dataset.nombre  = (u.name || u.nickname).toLowerCase();
    div.className = 'flex items-center gap-4 p-4 rounded-[1.5rem] hover:bg-[#111814] transition cursor-pointer group w-full';
    div.innerHTML = `
        <div class="w-14 h-14 rounded-full bg-gray-900 border border-white/5 overflow-hidden flex-shrink-0">
            <img src="${escapeHtml(foto)}" alt="" class="w-full h-full object-cover">
        </div>
        <div class="flex flex-col flex-grow truncate">
            <span class="text-sm font-black italic uppercase tracking-tight text-white group-hover:text-[#00bf63] transition">${escapeHtml(u.name || u.nickname)}</span>
            <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500 truncate italic">${preview}</span>
                <span class="text-[9px] text-gray-700 font-bold uppercase shrink-0">${tiempo}</span>
            </div>
        </div>
        ${conv.no_leidos > 0
            ? `<div class="w-2.5 h-2.5 rounded-full bg-[#00bf63] shadow-[0_0_10px_#00bf63] flex-shrink-0"></div>`
            : ''}
    `;
    div.addEventListener('click', () => abrirConversacion(conv.id_conversacion, conv.otro_usuario));
    return div;
}

// ── Render: burbuja de mensaje (panel derecho) ────────────────────────────────
function renderMensajeEl(msg) {
    const wrap = document.createElement('div');
    wrap.dataset.msgId = msg.id_mensaje;

    if (msg.es_mio) {
        wrap.className = 'flex justify-end items-end gap-1 group/msg';
        wrap.innerHTML = `
            <button class="btn-del-msg opacity-0 group-hover/msg:opacity-100 transition-opacity text-gray-600 hover:text-red-400 p-1 shrink-0"
                    data-id="${msg.id_mensaje}" title="Borrar">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
            <div class="max-w-[75%] min-w-0 bg-[#00bf63] text-black rounded-2xl rounded-br-sm px-4 py-2 text-sm font-medium break-all whitespace-pre-wrap">${escapeHtml(msg.contenido)}</div>`;
        wrap.querySelector('.btn-del-msg').addEventListener('click', () => eliminarMensaje(msg.id_mensaje, wrap));
    } else {
        wrap.className = 'flex justify-start';
        wrap.innerHTML = `
            <div class="max-w-[75%] min-w-0 bg-[#111814] text-white rounded-2xl rounded-bl-sm px-4 py-2 text-sm font-medium break-all whitespace-pre-wrap border border-white/5">${escapeHtml(msg.contenido)}</div>`;
    }
    return wrap;
}

// ── Indicador "Visto" ────────────────────────────────────────────────────────────
function _actualizarVisto(ultimoLeido) {
    const panel = document.getElementById('chat_mensajes');
    if (!panel) return;
    // Quitar visto previo
    panel.querySelectorAll('.visto-indicator').forEach(el => el.remove());
    if (!ultimoLeido) return;
    const target = panel.querySelector(`[data-msg-id="${ultimoLeido}"]`);
    if (!target) return;
    const span = document.createElement('div');
    span.className = 'visto-indicator flex justify-end pr-1';
    span.innerHTML = '<span class="text-[10px] text-gray-500 font-bold">Visto &#10003;&#10003;</span>';
    target.after(span);
}

// ── Eliminar mensaje propio ───────────────────────────────────────────────────────
async function eliminarMensaje(idMsg, wrapEl) {
    try {
        const res  = await fetch('../../backend/public/api/auth/mensajes.php', {
            method: 'DELETE', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_mensaje: idMsg }),
        });
        const data = await res.json();
        if (data.success) {
            // Quitar visto si estaba asociado a este mensaje
            wrapEl.nextElementSibling?.classList.contains('visto-indicator') && wrapEl.nextElementSibling.remove();
            wrapEl.style.opacity = '0';
            wrapEl.style.transition = 'opacity 0.15s';
            setTimeout(() => wrapEl.remove(), 150);
        }
    } catch (_) {}
}

// ── Cargar lista de conversaciones ────────────────────────────────────────────
async function cargarConversaciones() {
    try {
        const res  = await fetch('../../backend/public/api/auth/mensajes.php', { credentials: 'include' });
        const data = await res.json();
        if (!data.success) return;

        _todasConvs = data.conversaciones;
        renderListaChats(_todasConvs);

        // Datos del usuario en sesión (sidebar)
        const yo = data.yo;
        if (yo) {
            const foto = yo.foto_perfil || NO_FOTO;
            document.getElementById('foto_user_aside').src             = foto;
            document.getElementById('nombre_user_aside').textContent   = yo.name || yo.nickname;
            document.getElementById('username_user_aside').textContent = '@' + yo.nickname;
            const mobile = document.getElementById('foto_user_mobile_nav');
            if (mobile) mobile.src = foto;

            document.querySelectorAll('a[href="../auth/login.html"]').forEach(a => {
                if (a.textContent.trim().toLowerCase().includes('cerrar')) {
                    a.href = '#';
                    a.addEventListener('click', cerrarSesion);
                }
            });
        }
    } catch (e) {
        console.error('Error cargando conversaciones:', e);
    }
}

function renderListaChats(convs) {
    const lista    = document.getElementById('lista_chats');
    const emptySt  = document.getElementById('empty_chats');
    lista.innerHTML = '';

    if (convs.length === 0) {
        emptySt.classList.remove('hidden');
        return;
    }
    emptySt.classList.add('hidden');
    convs.forEach(c => lista.appendChild(renderChatRow(c)));
}

// ── Abrir conversación ────────────────────────────────────────────────────────
async function abrirConversacion(idConv, otroUsuario) {
    _convActiva  = { id_conversacion: idConv, otro_usuario: otroUsuario };
    _ultimoMsgId = 0;

    // Parar polling anterior
    if (_polling) { clearInterval(_polling); _polling = null; }

    // Actualizar cabecera
    const foto = otroUsuario.foto_perfil || NO_FOTO;
    document.getElementById('chat_header_avatar').src    = foto;
    document.getElementById('chat_header_name').textContent = otroUsuario.name || otroUsuario.nickname;
    document.getElementById('chat_header_nick').textContent = '@' + otroUsuario.nickname;
    document.getElementById('chat_header_link').href     = `usuario_publico.html?user=${encodeURIComponent(otroUsuario.nickname)}`;

    // Mostrar vista chat, ocultar welcome
    document.getElementById('welcome_state').classList.add('hidden');
    const chatView = document.getElementById('chat_view');
    chatView.classList.remove('hidden');
    chatView.classList.add('flex');

    // Móvil: ocultar lista, mostrar panel
    document.getElementById('lista_convs').classList.add('hidden');
    const panel = document.getElementById('panel_chat');
    panel.classList.remove('hidden');
    panel.classList.add('flex');

    // Vaciar mensajes y cargar
    document.getElementById('chat_mensajes').innerHTML = '<p class="text-gray-600 text-xs text-center py-4">Cargando...</p>';
    await _cargarMensajesCompleto(idConv);

    // Polling cada 5 segundos
    _polling = setInterval(() => _pollNuevosMensajes(), 5000);
}

async function _cargarMensajesCompleto(idConv) {
    try {
        const res  = await fetch(`../../backend/public/api/auth/mensajes.php?id_conversacion=${idConv}`, { credentials: 'include' });
        const data = await res.json();
        if (!data.success) return;

        const panel = document.getElementById('chat_mensajes');
        panel.innerHTML = '';

        if (data.mensajes.length === 0) {
            panel.innerHTML = '<p class="text-gray-600 text-xs text-center py-6 italic">Envía el primer mensaje</p>';
        } else {
            data.mensajes.forEach(m => {
                panel.appendChild(renderMensajeEl(m));
                _ultimoMsgId = Math.max(_ultimoMsgId, m.id_mensaje);
            });
            panel.scrollTop = panel.scrollHeight;
        }
        _actualizarVisto(data.ultimo_leido || 0);
    } catch (e) {
        console.error('Error cargando mensajes:', e);
    }
}

async function _pollNuevosMensajes() {
    if (!_convActiva) return;
    try {
        const url = `../../backend/public/api/auth/mensajes.php?id_conversacion=${_convActiva.id_conversacion}&ultimo_id=${_ultimoMsgId}`;
        const res  = await fetch(url, { credentials: 'include' });
        const data = await res.json();
        if (!data.success || data.mensajes.length === 0) return;

        const panel = document.getElementById('chat_mensajes');
        // Quitar mensaje "Envía el primer mensaje" si existe
        const emptyP = panel.querySelector('p.italic');
        if (emptyP) emptyP.remove();

        data.mensajes.forEach(m => {
            panel.appendChild(renderMensajeEl(m));
            _ultimoMsgId = Math.max(_ultimoMsgId, m.id_mensaje);
        });
        panel.scrollTop = panel.scrollHeight;
        _actualizarVisto(data.ultimo_leido || 0);
    } catch (_) {}
}

// ── Cerrar chat (móvil) ───────────────────────────────────────────────────────
function cerrarChatMovil() {
    if (_polling) { clearInterval(_polling); _polling = null; }
    _convActiva = null;

    document.getElementById('lista_convs').classList.remove('hidden');

    const panel    = document.getElementById('panel_chat');
    panel.classList.add('hidden');
    panel.classList.remove('flex');

    const chatView = document.getElementById('chat_view');
    chatView.classList.add('hidden');
    chatView.classList.remove('flex');

    document.getElementById('welcome_state').classList.remove('hidden');
}

// ── Enviar mensaje ────────────────────────────────────────────────────────────
async function enviarMensaje() {
    if (!_convActiva) return;
    const input    = document.getElementById('chat_input');
    const contenido = input.value.trim();
    if (!contenido) return;
    input.value = '';

    try {
        const res  = await fetch('../../backend/public/api/auth/mensajes.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'enviar', id_conversacion: _convActiva.id_conversacion, contenido }),
        });
        const data = await res.json();
        if (data.success) {
            const panel = document.getElementById('chat_mensajes');
            const emptyP = panel.querySelector('p.italic');
            if (emptyP) emptyP.remove();
            panel.appendChild(renderMensajeEl(data.mensaje));
            _ultimoMsgId = Math.max(_ultimoMsgId, data.mensaje.id_mensaje);
            panel.scrollTop = panel.scrollHeight;
        }
    } catch (e) {
        console.error('Error enviando mensaje:', e);
    }
}

// ── Filtro local de chats ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const buscador = document.getElementById('input_buscador_chats');
    if (buscador) {
        buscador.addEventListener('input', () => {
            const q = buscador.value.toLowerCase().trim();
            const filtradas = q
                ? _todasConvs.filter(c => {
                    const u = c.otro_usuario;
                    return (u.name || '').toLowerCase().includes(q) || u.nickname.toLowerCase().includes(q);
                  })
                : _todasConvs;
            renderListaChats(filtradas);
        });
    }

    // Enter para enviar mensaje
    const chatInput = document.getElementById('chat_input');
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje(); } });
    }

    // Parar polling al salir de la página
    window.addEventListener('beforeunload', () => { if (_polling) clearInterval(_polling); });
});

// ── Modal Nuevo Mensaje ───────────────────────────────────────────────────────
let _debounceNuevoMsj = null;

function abrirModalNuevoMsj() {
    document.getElementById('modal_nuevo_msj').classList.remove('hidden');
    document.getElementById('input_buscar_nuevo_msj').value = '';
    document.getElementById('resultados_nuevo_msj').innerHTML = '';
    setTimeout(() => document.getElementById('input_buscar_nuevo_msj').focus(), 100);
}

function cerrarModalNuevoMsj() {
    document.getElementById('modal_nuevo_msj').classList.add('hidden');
}

async function _buscarUsuariosNuevoMsj(q) {
    const cont = document.getElementById('resultados_nuevo_msj');
    if (!q) { cont.innerHTML = ''; return; }
    cont.innerHTML = '<p class="text-gray-500 text-xs text-center py-3">Buscando...</p>';

    try {
        const res  = await fetch(`../../backend/public/api/auth/mensajes.php?buscar=${encodeURIComponent(q)}`, { credentials: 'include' });
        const data = await res.json();
        cont.innerHTML = '';

        if (!data.success || data.usuarios.length === 0) {
            cont.innerHTML = '<p class="text-gray-600 text-xs text-center py-3">Sin resultados</p>';
            return;
        }

        data.usuarios.forEach(u => {
            const foto = u.foto_perfil || NO_FOTO;
            const div  = document.createElement('div');
            div.className = 'flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition';
            div.innerHTML = `
                <img src="${escapeHtml(foto)}" class="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0">
                <div class="flex flex-col truncate">
                    <span class="text-sm font-black text-white truncate">${escapeHtml(u.name || u.nickname)}</span>
                    <span class="text-xs text-gray-500 font-bold uppercase tracking-widest">@${escapeHtml(u.nickname)}</span>
                </div>`;
            div.addEventListener('click', () => iniciarConversacion(u.nickname));
            cont.appendChild(div);
        });
    } catch (_) {
        cont.innerHTML = '<p class="text-red-400 text-xs text-center py-3">Error de conexion</p>';
    }
}

async function iniciarConversacion(nick) {
    cerrarModalNuevoMsj();
    try {
        const res  = await fetch('../../backend/public/api/auth/mensajes.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'iniciar', nick }),
        });
        const data = await res.json();
        if (!data.success) return;

        // Buscar o construir el objeto otro_usuario
        let otroUsuario = null;
        const enLista = _todasConvs.find(c => c.id_conversacion === data.id_conversacion);
        if (enLista) {
            otroUsuario = enLista.otro_usuario;
        } else {
            // Refrescar lista y buscar
            await cargarConversaciones();
            const tras = _todasConvs.find(c => c.id_conversacion === data.id_conversacion);
            otroUsuario = tras ? tras.otro_usuario : { nickname: nick, name: nick, foto_perfil: null };
        }

        abrirConversacion(data.id_conversacion, otroUsuario);
    } catch (e) {
        console.error('Error iniciando conversacion:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inputNuevoMsj = document.getElementById('input_buscar_nuevo_msj');
    if (inputNuevoMsj) {
        inputNuevoMsj.addEventListener('input', () => {
            clearTimeout(_debounceNuevoMsj);
            _debounceNuevoMsj = setTimeout(() => _buscarUsuariosNuevoMsj(inputNuevoMsj.value.trim()), 300);
        });
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
        if (data.success) { cerrarModalPublicar(); }
        else { errEl.textContent = data.message || 'Error al publicar.'; errEl.classList.remove('hidden'); }
    } catch (e) {
        errEl.textContent = 'Error de conexion con el servidor.';
        errEl.classList.remove('hidden');
    } finally { btn.disabled = false; btn.textContent = 'Publicar'; }
}

// ── Carga inicial 
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('../../backend/public/api/auth/user.php', { credentials: 'include' });
        if (!res.ok) { window.location.href = '../auth/login.html'; return; }
        const data = await res.json();
        if (!data.success) { window.location.href = '../auth/login.html'; return; }
    } catch (_) {
        window.location.href = '../auth/login.html';
        return;
    }
    await cargarConversaciones();

    // Abrir conversación desde URL (?conv=id)
    const params = new URLSearchParams(window.location.search);
    const convParam = params.get('conv');
    if (convParam) {
        const conv = _todasConvs.find(c => c.id_conversacion === parseInt(convParam));
        if (conv) abrirConversacion(conv.id_conversacion, conv.otro_usuario);
    }

    // Desde usuario_publico.html se puede abrir mensajes con ?nick=xxx
    const nickParam = params.get('nick');
    if (nickParam) iniciarConversacion(nickParam);
});
