// Función para manejar el inicio de sesión con usuario y contraseña
const Swal = require('sweetalert2');
function validateLogin(event) {
    event.preventDefault();

    // Activa el indicador de carga
    const loadingElement = document.querySelector('.loading');
    loadingElement.classList.add('active');

    const usernameInput = document.querySelector('input[placeholder="Username"]').value;
    const passwordInput = document.querySelector('input[placeholder="Password"]').value;

    const apiUrl = 'http://20.3.4.249/api/users/me'; // URL de tu API
    const credentials = btoa(`${usernameInput}:${passwordInput}`);

    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${credentials}`, // Encabezado con las credenciales
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
            sessionStorage.setItem('authCredentials', credentials);
            sessionStorage.setItem('username', data.username);
            sessionStorage.setItem('userId', data.id);
            sessionStorage.setItem('authProvider', data.authProvider);
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
            loadingElement.classList.remove('active');
        });
}
window.validateLogin = validateLogin;
function handleCredentialResponse(response) {
    const idToken = response.credential; // Obtén el id_token de la respuesta de Google
    console.log("ID Token de Google:", idToken);

    // Activa el indicador de carga
    const loadingElement = document.querySelector('.loading');
    loadingElement.classList.add('active');

    // URL de tu backend (Asegúrate de que esté apuntando al endpoint correcto)
    const apiUrl = 'http://20.3.4.249/auth/google'; // Endpoint de autenticación en tu backend

    // Enviar el id_token al backend
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_token: idToken }) // Enviamos el ID token de Google
    })
        .then(response => response.text())
        .then(encryptedData => {
            const decryptedData = decryptData(encryptedData);
            // Convierte la respuesta desencriptada en un objeto JSON
            const data = JSON.parse(decryptedData);
            if (data.token) {
                console.log('Token JWT recibido:', data.token);
                // Guardamos el JWT recibido en sessionStorage
                sessionStorage.setItem('authToken', data.token);
                sessionStorage.setItem('username', data.username);
                sessionStorage.setItem('userId', data.id);
                sessionStorage.setItem('authProvider', data.authProvider);

                // Redirige al usuario a la página principal
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
                    window.location.href = '/html/home.html'; // Redirige a la página de inicio
                });
            } else {
                // Si no se recibe el token JWT
                Swal.fire({
                    title: "Error",
                    text: "Failed to generate JWT. Please try again.",
                    icon: "error",
                    color: "#fff",
                    background: "#252525",
                    confirmButtonColor: "#f27474",
                    heightAuto: false,
                });
            }
        })
        .catch(() => {
            Swal.fire({
                title: "Error",
                heightAuto: false,
                color: "#fff",
                background: "#252525",
                confirmButtonColor: "#f27474",
                text: "Failed to log in with Google. Please try again.",
                icon: "error"
            });
        })
        .finally(() => {
            loadingElement.classList.remove('active');
        });
}

// Nueva función que se ejecuta cuando la API de Google se carga completamente
function initializeGoogleSignIn() {
    google.accounts.id.initialize({
        client_id: '427937242400-1g9redl0nc6al5bu6s4fbqvlu4s7h9mk.apps.googleusercontent.com', // Reemplaza con tu Client ID de Google
        callback: handleCredentialResponse // Función que maneja la respuesta del login
    });

    // Renderiza el botón de Google
    google.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        { theme: "outline", size: "large" }  // Personaliza el botón si lo deseas
    );
}
const encodedKey = "cHVrb2puYzEyMzQ1Njc4OQ=="; 
const SECRET_KEY = atob(encodedKey); 
function decryptData(cipherText) {
    try {
        // Descifrar utilizando la clave secreta
        const bytes = CryptoJS.AES.decrypt(cipherText, CryptoJS.enc.Utf8.parse(SECRET_KEY), {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        // Convertir a cadena UTF-8
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedText) {
            throw new Error("Decryption failed or data is not UTF-8 compliant.");
        }
        return decryptedText;
    } catch (error) {
        console.error("Error during decryption:", error.message);
        throw error;
    }
}

module.exports = {
    decryptData
};

// Inicializa el inicio de sesión con Google cuando el documento esté listo
document.addEventListener('DOMContentLoaded', function () {
    // El script de Google ya debe estar cargado por completo en este momento
});
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        validateLogin
    };
}