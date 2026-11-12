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

// Mostrar mensaje si el mapa no carga
window.initMap = function () {
    // Si la API carga correctamente, ocultamos el mensaje
    // No se oculta el mensaje, ya que siempre debe ser visible
}
window.gm_authFailure = function () {
    document.getElementById('mapa-mensaje-error').classList.remove('hidden');
}
// Si tras 2 segundos no se ha llamado a initMap, mostramos el mensaje
setTimeout(function () {
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        document.getElementById('mapa-mensaje-error').classList.remove('hidden');
    }
}, 2000);

function initMap() {
    const centro = { lat: 40.4167, lng: -3.70325 };
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: centro,
        styles: [{ "stylers": [{ "visibility": "simplified" }] }, { "elementType": "labels", "stylers": [{ "visibility": "off" }] }]
    });

    map.addListener("click", (e) => {
        const nombre = prompt("Nombre del nuevo sitio deportivo:");
        if (nombre) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            alert("Coordenadas capturadas: " + lat + ", " + lng + " para el sitio: " + nombre);
        }
    });
}