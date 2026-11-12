window.onload = function () {
    document.getElementById('signup-form').addEventListener('submit', function (e) {
        e.preventDefault(); // Evita que la página se recargue

        // Ocultamos y limpiamos todos los errores previos
        document.querySelectorAll('.error-text').forEach(el => {
            el.classList.add('hidden');
            el.textContent = '';
        });

        // Validación del nickname en cliente
        const nicknameInput = this.querySelector('[name="nickname"]');
        const nicknameValue = nicknameInput ? nicknameInput.value : '';
        if (!/^[a-zA-Z0-9._-]+$/.test(nicknameValue)) {
            const errNickname = document.getElementById('err_nickname');
            if (errNickname) {
                errNickname.textContent = 'El nickname solo puede contener letras, números, puntos (.), guiones (-) y guiones bajos (_). Sin espacios.';
                errNickname.classList.remove('hidden');
            }
            return;
        }

        // Recopilamos los datos del formulario
        const formData = new FormData(this);

        // Enviamos los datos a PHP usando Fetch
        fetch('../../backend/public/api/auth/signup.php', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json()) // Esperamos un JSON de vuelta
            .then(data => {
                if (data.success) {
                    // Si todo ha ido bien, redirigimos al login o mostramos un mensaje
                    alert("¡Cuenta creada con éxito! Redirigiendo al login...");
                    window.location.href = "login.html";
                } else {
                    // Si hay errores, los pintamos en sus respectivos campos
                    for (const campo in data.errores) {
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
