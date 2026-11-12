window.onload = function () {
    document.getElementById('login-form').addEventListener('submit', function (e) {
        e.preventDefault(); // Evita que la página se recargue

        // Ocultamos y limpiamos todos los errores previos
        document.querySelectorAll('.error-text').forEach(el => {
            el.classList.add('hidden');
            el.textContent = '';
        });

        // Recopilamos los datos del formulario
        const formData = new FormData(this);

        // Enviamos los datos a PHP usando Fetch
        fetch('../../backend/public/api/auth/login.php', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json()) // Esperamos un JSON de vuelta
            .then(data => {
                if (data.success) {
                    // Si es admin al panel de admin, sino al index
                    if (data.admin) {
                        window.location.href = "../admin/index.html";
                    } else {
                        window.location.href = "../user/inicio.html";
                    }
                } else {
                    // Si el usuario está baneado, mostrar el error general arriba
                    if (data.errores && data.errores.baneado) {
                        const generalErr = document.getElementById('err_general');
                        generalErr.textContent = data.errores.baneado;
                        generalErr.classList.remove('hidden');
                    }
                    // Si hay otros errores, los pintamos en sus respectivos campos
                    for (const campo in data.errores) {
                        if (campo === 'baneado') continue;
                        const errorElement = document.getElementById('err_' + campo);
                        if (errorElement) {
                            errorElement.textContent = data.errores[campo];
                            errorElement.classList.remove('hidden'); // Mostramos el mensaje
                        }
                    }
                }
            })
            .catch(error => {
                console.error('Error en la petición:', error);
                const generalErr = document.getElementById('err_general');
                generalErr.textContent = "Error de conexión con el servidor.";
                generalErr.classList.remove('hidden');
            });
    });
}