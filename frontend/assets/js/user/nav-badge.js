/**
 * nav-badge.js
 * Se incluye en todas las páginas de usuario.
 * Consulta contadores de notificaciones y mensajes no leídos y muestra badges
 * en el sidebar (desktop) y en el nav móvil.
 */
(async function () {
    function aplicarBadgeSidebar(id, badgeId, n) {
        const label = n > 9 ? '9+' : String(n);
        const el = document.getElementById(id);
        if (!el) return;
        const prev = document.getElementById(badgeId);
        if (prev) prev.remove();
        const badge = document.createElement('span');
        badge.id = badgeId;
        badge.className = 'ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#00bf63] text-black text-[10px] font-black';
        badge.textContent = label;
        el.appendChild(badge);
    }

    function aplicarDotMobile(id, dotId) {
        const el = document.getElementById(id);
        if (!el) return;
        const prev = document.getElementById(dotId);
        if (prev) prev.remove();
        el.style.position = 'relative';
        el.style.display  = 'inline-flex';
        const dot = document.createElement('span');
        dot.id = dotId;
        dot.className = 'absolute -top-1 -right-1 w-[8px] h-[8px] rounded-full bg-[#00bf63] border border-black';
        el.appendChild(dot);
    }

    try {
        const [resNotif, resMsgs] = await Promise.all([
            fetch('../../backend/public/api/auth/notificaciones.php?count=1', { credentials: 'include' }),
            fetch('../../backend/public/api/auth/mensajes.php?count=1',       { credentials: 'include' }),
        ]);

        if (resNotif.ok) {
            const data = await resNotif.json();
            const n = parseInt(data.no_leidas, 10);
            if (n > 0) {
                aplicarBadgeSidebar('navNotifLink',    'badgeNotifSidebar', n);
                aplicarDotMobile(   'navNotifMobile',  'badgeNotifMobile');
            }
        }

        if (resMsgs.ok) {
            const data = await resMsgs.json();
            const n = parseInt(data.no_leidos, 10);
            if (n > 0) {
                aplicarBadgeSidebar('navMensajesLink',   'badgeMensajesSidebar', n);
                aplicarDotMobile(   'navMensajesMobile', 'badgeMensajesMobile');
            }
        }
    } catch (_) { /* silencioso */ }
})();
