/**
 * story-viewer.js — Visor de historias compartido.
 * Inyecta el modal en el DOM y expone:
 *   window.abrirHistorias(grupos, idx)
 *   window.cerrarHistoria()
 *
 * Formato de `grupos`:
 * [{ nickname, foto_perfil, historias: [{ id_historia, imagen, fecha }, …] }, …]
 */
(function () {
    const STORY_DURATION = 5000; // ms por historia de imagen

    let _grupos   = [];
    let _gIdx     = 0;
    let _iIdx     = 0;
    let _timer    = null;
    let _animRaf  = null;

    // ── Inyección del modal ───────────────────────────────────────────────────
    function _inject() {
        if (document.getElementById('modalHistoria')) return;
        const el = document.createElement('div');
        el.id = 'modalHistoria';
        el.className = 'hidden fixed inset-0 z-[200] bg-black flex items-center justify-center';
        el.innerHTML = `
            <div id="storyProgressBars" class="absolute top-3 left-3 right-3 flex gap-1 z-30 pointer-events-none"></div>
            <div class="absolute top-8 left-0 right-0 flex items-center gap-3 px-4 z-30">
                <img id="storyAvatar" src="" alt="" class="w-9 h-9 rounded-full object-cover border-2 border-[#00bf63] shrink-0">
                <div class="flex flex-col flex-1 min-w-0">
                    <span id="storyNick" class="text-sm font-black text-white uppercase truncate"></span>
                    <span id="storyTime" class="text-[10px] text-white/60"></span>
                </div>
                <button id="btnCerrarHistoria" class="text-white p-2 hover:text-gray-400 transition">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <img id="storyImg" src="" alt="" class="max-h-screen max-w-full object-contain select-none pointer-events-none">
            <video id="storyVideo" src="" class="max-h-screen max-w-full object-contain hidden pointer-events-none" autoplay muted playsinline></video>
            <div class="absolute inset-0 flex z-20 pt-24">
                <div id="storyZonePrev" class="w-1/3 h-full cursor-pointer"></div>
                <div id="storyZoneNext" class="w-2/3 h-full cursor-pointer"></div>
            </div>`;
        document.body.appendChild(el);
        document.getElementById('btnCerrarHistoria').addEventListener('click', cerrarHistoria);
        document.getElementById('storyZonePrev').addEventListener('click',     storyNavPrev);
        document.getElementById('storyZoneNext').addEventListener('click',     storyNavNext);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    function _tRel(fechaStr) {
        const diff = Math.floor((Date.now() - new Date(fechaStr)) / 1000);
        if (diff < 60)     return 'Ahora';
        if (diff < 3600)   return Math.floor(diff / 60) + ' min';
        if (diff < 86400)  return Math.floor(diff / 3600) + ' h';
        if (diff < 604800) return Math.floor(diff / 86400) + ' d';
        return new Date(fechaStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }

    function _clearTimers() {
        if (_timer)   { clearTimeout(_timer);           _timer   = null; }
        if (_animRaf) { cancelAnimationFrame(_animRaf); _animRaf = null; }
    }

    // ── API pública ───────────────────────────────────────────────────────────
    function abrirHistorias(grupos, idx) {
        _grupos = grupos;
        _gIdx   = idx || 0;
        _iIdx   = 0;
        document.getElementById('modalHistoria').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        _mostrar();
    }

    function cerrarHistoria() {
        document.getElementById('modalHistoria').classList.add('hidden');
        document.body.style.overflow = '';
        _clearTimers();
        const v = document.getElementById('storyVideo');
        v.pause(); v.src = '';
    }

    function storyNavNext() {
        const grupo = _grupos[_gIdx];
        if (_iIdx < grupo.historias.length - 1) {
            _iIdx++;
            _mostrar();
        } else if (_gIdx < _grupos.length - 1) {
            _gIdx++;
            _iIdx = 0;
            _mostrar();
        } else {
            cerrarHistoria();
        }
    }

    function storyNavPrev() {
        if (_iIdx > 0) {
            _iIdx--;
            _mostrar();
        } else if (_gIdx > 0) {
            _gIdx--;
            _iIdx = _grupos[_gIdx].historias.length - 1;
            _mostrar();
        }
    }

    // ── Renderizado interno ───────────────────────────────────────────────────
    function _mostrar() {
        _clearTimers();
        const grupo = _grupos[_gIdx];
        const story = grupo.historias[_iIdx];

        document.getElementById('storyAvatar').src       = grupo.foto_perfil || '';
        document.getElementById('storyNick').textContent = grupo.nickname;
        document.getElementById('storyTime').textContent = _tRel(story.fecha);

        // Barras de progreso
        const barsEl = document.getElementById('storyProgressBars');
        barsEl.innerHTML = '';
        grupo.historias.forEach((_, i) => {
            const bar  = document.createElement('div');
            bar.className = 'flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden';
            const fill = document.createElement('div');
            fill.className  = 'h-full rounded-full bg-white transition-none';
            fill.style.width = i < _iIdx ? '100%' : '0%';
            if (i === _iIdx) fill.id = 'storyProgressFill';
            bar.appendChild(fill);
            barsEl.appendChild(bar);
        });

        // Multimedia
        const img   = document.getElementById('storyImg');
        const video = document.getElementById('storyVideo');
        const isVid = /\.(mp4|mov)$/i.test(story.imagen);

        if (isVid) {
            img.classList.add('hidden');
            video.classList.remove('hidden');
            video.src = story.imagen;
            video.currentTime = 0;
            video.onloadedmetadata = function () {
                const dur = video.duration * 1000;
                _progreso(dur);
                _timer = setTimeout(storyNavNext, dur);
            };
            video.play().catch(function () {});
        } else {
            video.pause(); video.src = '';
            video.classList.add('hidden');
            img.classList.remove('hidden');
            img.src = story.imagen;
            _progreso(STORY_DURATION);
            _timer = setTimeout(storyNavNext, STORY_DURATION);
        }
    }

    function _progreso(durMs) {
        const fillEl = document.getElementById('storyProgressFill');
        if (!fillEl) return;
        const start = performance.now();
        function tick(now) {
            const pct = Math.min(((now - start) / durMs) * 100, 100);
            fillEl.style.width = pct + '%';
            if (pct < 100) _animRaf = requestAnimationFrame(tick);
        }
        _animRaf = requestAnimationFrame(tick);
    }

    // ── Inicialización ────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', _inject);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modalHistoria');
            if (modal && !modal.classList.contains('hidden')) {
                cerrarHistoria();
            }
        }
    });

    // Exportar al scope global
    window.abrirHistorias = abrirHistorias;
    window.cerrarHistoria = cerrarHistoria;
    window.storyNavNext   = storyNavNext;
    window.storyNavPrev   = storyNavPrev;

}());
