// ── Variables de estado de foto ───────────────────────────────────────────
let selectedFile  = null;
let eliminarFoto  = false;

// ── Helpers UI ────────────────────────────────────────────────────────────
function esMovil() { return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); }
function toggleUserMenu(event) { event.stopPropagation(); document.getElementById('userMenu').classList.toggle('hidden'); }
function abrirModalFoto() { document.getElementById('modalFoto').classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function cerrarModalFoto() { document.getElementById('modalFoto').classList.add('hidden'); document.body.style.overflow = 'auto'; }

let toastTimer = null;
function mostrarToast(mensaje, tipo) {
    const toast = document.getElementById('toast_ajustes');
    toast.textContent = mensaje;
    toast.className = 'fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl transition-all '
        + (tipo === 'success' ? 'bg-[#00bf63] text-black' : 'bg-red-500 text-white');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 3500);
}

function setFotoEnPagina(src) {
    const noFoto = '../assets/img/no_user_profile.png';
    const url = src || noFoto;
    document.getElementById('foto_user_ajustes').src = url;
    document.getElementById('foto_user_aside').src   = url;
    const mobile = document.getElementById('foto_user_mobile_nav');
    if (mobile) mobile.src = url;
}

// ── Modal foto ────────────────────────────────────────────────────────────
function handleFileSelected(file) {
    if (!file) return;
    selectedFile  = file;
    eliminarFoto  = false;
    const reader  = new FileReader();
    reader.onload = (e) => setFotoEnPagina(e.target.result);
    reader.readAsDataURL(file);
    cerrarModalFoto();
}

// ── Cierre global de menús ────────────────────────────────────────────────
document.addEventListener('click', function (event) {
    const userMenu = document.getElementById('userMenu');
    if (userMenu && !userMenu.classList.contains('hidden')) userMenu.classList.add('hidden');

    const menuGenero  = document.getElementById('menu_genero');
    const iconoGenero = document.getElementById('icono_genero');
    if (menuGenero && !menuGenero.classList.contains('hidden') && !event.target.closest('#dropdown_sexo_container')) {
        menuGenero.classList.add('hidden');
        iconoGenero.classList.remove('rotate-180');
    }
});

// ── Dropdown de Género ────────────────────────────────────────────────────
function seleccionarGenero(valor) {
    const opcionesGenero = document.querySelectorAll('.opcion-genero');
    const textoGenero    = document.getElementById('texto_genero');
    const btnGenero      = document.getElementById('btn_genero');
    const inputGenero    = document.getElementById('input_genero');

    opcionesGenero.forEach(opt => {
        const circulo = opt.querySelector('.radio-circulo');
        const check   = opt.querySelector('.check-icono');
        const esActiva = opt.dataset.valor === valor;
        circulo.classList.toggle('bg-white',       esActiva);
        circulo.classList.toggle('border-white',   esActiva);
        circulo.classList.toggle('border-gray-500', !esActiva);
        check.classList.toggle('hidden', !esActiva);
        if (esActiva) {
            textoGenero.innerText = opt.querySelector('.texto-opcion').innerText;
            btnGenero.classList.remove('text-white/50');
            btnGenero.classList.add('text-white');
        }
    });
    inputGenero.value = valor;
}

// ── Cerrar sesión ─────────────────────────────────────────────────────────
async function cerrarSesion(event) {
    event.preventDefault();
    try {
        await fetch('../../backend/public/api/auth/logout.php', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    window.location.href = '../auth/login.html';
}

// ── Modal Publicar ────────────────────────────────────────────────────────
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

// ── DOMContentLoaded ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
    if (esMovil()) document.getElementById('opcionCamara').classList.remove('hidden');

    // Event listeners del modal de foto
    document.getElementById('modalFoto').addEventListener('click', function (e) {
        if (e.target === this) cerrarModalFoto();
    });
    document.getElementById('input_file_foto').addEventListener('change', function () {
        handleFileSelected(this.files[0]);
    });
    document.getElementById('input_file_camara').addEventListener('change', function () {
        handleFileSelected(this.files[0]);
    });
    document.getElementById('btn_eliminar_foto').addEventListener('click', function () {
        selectedFile = null;
        eliminarFoto = true;
        setFotoEnPagina(null);
        cerrarModalFoto();
    });

    // Dropdown de género
    const btnGenero      = document.getElementById('btn_genero');
    const menuGenero     = document.getElementById('menu_genero');
    const iconoGenero    = document.getElementById('icono_genero');
    const opcionesGenero = document.querySelectorAll('.opcion-genero');

    btnGenero.addEventListener('click', (e) => {
        e.stopPropagation();
        menuGenero.classList.toggle('hidden');
        iconoGenero.classList.toggle('rotate-180');
    });
    opcionesGenero.forEach(opcion => {
        opcion.addEventListener('click', () => {
            seleccionarGenero(opcion.dataset.valor);
            menuGenero.classList.add('hidden');
            iconoGenero.classList.remove('rotate-180');
        });
    });

    // Contador bio
    document.getElementById('input_bio').addEventListener('input', function () {
        document.getElementById('contador_bio').textContent = this.value.length + ' / 150';
    });

    // Submit del formulario
    document.getElementById('form_ajustes').addEventListener('submit', async function (e) {
        e.preventDefault();
        const btn = document.getElementById('btn_guardar_ajustes');
        btn.disabled    = true;
        btn.textContent = 'Guardando...';

        const fd = new FormData();
        fd.append('bio',             document.getElementById('input_bio').value);
        fd.append('website',         document.getElementById('input_website').value);
        fd.append('cuenta_privada',  document.getElementById('input_cuenta_privada').value);
        const genero = document.getElementById('input_genero').value;
        if (genero) fd.append('genero', genero);

        if (eliminarFoto) {
            fd.append('eliminar_foto', '1');
        } else if (selectedFile) {
            fd.append('foto', selectedFile);
        }

        try {
            const res = await fetch('../../backend/public/api/auth/ajustes.php', {
                method: 'POST',
                credentials: 'include',
                body: fd
            });
            const data = await res.json();

            if (data.success) {
                mostrarToast('¡Cambios guardados!', 'success');
                if ('foto_perfil' in data) {
                    setFotoEnPagina(data.foto_perfil);
                }
                selectedFile = null;
                eliminarFoto = false;
            } else {
                const msg = Object.values(data.errores || {}).join(' ');
                mostrarToast(msg || 'Error al guardar.', 'error');
            }
        } catch (_) {
            mostrarToast('Error de conexión con el servidor.', 'error');
        } finally {
            btn.disabled    = false;
            btn.textContent = 'Enviar cambios';
        }
    });

    // Cargar datos del usuario
    try {
        const res = await fetch('../../backend/public/api/auth/ajustes.php', { credentials: 'include' });
        if (!res.ok) { window.location.href = '../auth/login.html'; return; }
        const data = await res.json();
        if (!data.success) { window.location.href = '../auth/login.html'; return; }

        const u    = data.usuario;
        const foto = u.foto_perfil || '../assets/img/no_user_profile.png';

        document.getElementById('foto_user_aside').src             = foto;
        document.getElementById('nombre_user_aside').textContent   = u.name || u.nickname;
        document.getElementById('username_user_aside').textContent = '@' + u.nickname;
        const mobileNav = document.getElementById('foto_user_mobile_nav');
        if (mobileNav) mobileNav.src = foto;

        document.getElementById('foto_user_ajustes').src            = foto;
        document.getElementById('nombre_user_ajustes').textContent  = u.name || u.nickname;
        document.getElementById('username_user_ajustes').textContent = '@' + u.nickname;

        document.getElementById('input_bio').value     = u.bio     || '';
        document.getElementById('input_website').value = u.website || '';
        document.getElementById('contador_bio').textContent = (u.bio ? u.bio.length : 0) + ' / 150';

        if (u.genero) seleccionarGenero(u.genero);

        // Toggle cuenta privada
        const btnToggle = document.getElementById('btn_toggle_privada');
        const dotPrivada = document.getElementById('dot_privada');
        const inputPrivada = document.getElementById('input_cuenta_privada');

        function setPrivada(activa) {
            inputPrivada.value = activa ? '1' : '0';
            btnToggle.setAttribute('aria-checked', activa ? 'true' : 'false');
            btnToggle.style.backgroundColor = activa ? '#00bf63' : '';
            btnToggle.classList.toggle('bg-[#00bf63]', activa);
            btnToggle.classList.toggle('bg-gray-700', !activa);
            dotPrivada.style.transform = activa ? 'translateX(28px)' : 'translateX(4px)';
        }

        setPrivada(parseInt(u.cuenta_privada) === 1);
        btnToggle.addEventListener('click', () => {
            setPrivada(inputPrivada.value !== '1');
        });

        document.querySelectorAll('a[href="../auth/login.html"]').forEach(function (a) {
            if (a.textContent.trim().toLowerCase().includes('cerrar')) {
                a.href = '#';
                a.addEventListener('click', cerrarSesion);
            }
        });

    } catch (e) {
        console.error('Error cargando ajustes:', e);
        window.location.href = '../auth/login.html';
    }
});
