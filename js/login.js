
function validateLogin(event) {
    event.preventDefault();

    // Activa el indicador de carga
    const loadingElement = document.querySelector('.loading');
    loadingElement.classList.add('active');

    const usernameInput = document.querySelector('input[placeholder="Username"]').value;
    const passwordInput = document.querySelector('input[placeholder="Password"]').value;

    // Definimos la URL de la API
    //NOSONAR
    const apiUrl = 'http://20.3.4.249:80/api/users/me'; //NOSONAR

    // Codificamos las credenciales en base64
    const credentials = btoa(`${usernameInput}:${passwordInput}`);

    // Hacemos la solicitud a la API
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${credentials}`, // Añadimos el encabezado de autenticación
            'Content-Type': 'application/json' 
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); 
    })
    .then(data => {
        // Guardamos las credenciales en sessionStorage para futuras solicitudes
        sessionStorage.setItem('authCredentials', credentials);
        sessionStorage.setItem('username', data.username);
        sessionStorage.setItem('userId', data.id);
        Swal.fire({
            title: "Welcome!",
            text: `${data.username}`,
            icon: "success",
            color: "#fff",
            heightAuto: false,
            background: "#252525",
            confirmButtonColor: "#ccb043"
        }).then(() => {
            document.body.classList.remove('no-scroll');
            window.location.href = '/html/home.html'; // Redirige después de que el usuario cierre la alerta
        });
    })
    .catch(() => {
        Swal.fire({
            title: "Error",
            heightAuto: false,
            color: "#fff",
            background: "#252525",
            confirmButtonColor: "#f27474",
            text: "Failed to log in. Please verify your credentials.",
            icon: "error"
        });
    })
    .finally(() => {
        // Desactiva el indicador de carga
        loadingElement.classList.remove('active');
    });
}

document.querySelector('.login-btn').addEventListener('click', validateLogin);