
const puko = document.getElementById("puko");
const barraLateral = document.querySelector(".barra-lateral");
const spans = document.querySelectorAll("span");
const palanca = document.querySelector(".switch");
const circulo = document.querySelector(".circulo");
const menu = document.querySelector(".menu");
const main = document.querySelector("main");
const edit_btn = document.querySelector(".editUser");
const avaliable_auction = document.querySelector(".available-auctions");
const log_icon = document.querySelector(".logOut-icon");
menu.addEventListener("click", () => {
    barraLateral.classList.toggle("max-barra-lateral");
    if (barraLateral.classList.contains("max-barra-lateral")) {
        menu.children[0].style.display = "none";
        menu.children[1].style.display = "block";
    } else {
        menu.children[1].style.display = "none";
        menu.children[0].style.display = "block";
    }
    if (window.innerWidth <= 320) {
        barraLateral.classList.add("mini-barra-lateral");
        main.classList.add("min-main");
        spans.forEach((span) => {
            span.classList.add("oculto");
        })
    }
});
function getAuthHeaders() {
    const credentials = sessionStorage.getItem('authCredentials');
    return {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
    };
}

function getAuthHeadersGoogle() {
    const authToken = sessionStorage.getItem('authToken');
    return {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };
}
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
function parseUserStringToJSON(userString) {
    const jsonString = userString
        .replace(/(\w+)=/g, '"$1":')   // Reemplaza `clave=` por `"clave":`
        .replace(/'/g, '"')            // Reemplaza comillas simples por comillas dobles
        .replace(/User\{/, '{')        // Reemplaza `User{` por `{`
        .replace(/}$/, '}')            // Asegura que termina con `}`
        .replace(/:\s*([A-Za-z_]\w*)/g, ':"$1"'); // Asegura que valores no numéricos estén entre comillas

    return JSON.parse(jsonString);
}
async function fetchUserMoney() {
    try {
        const authProvider = sessionStorage.getItem('authProvider');
        const montoElement = document.querySelector('.total-amount span');
        let userResponse;

        if (authProvider === 'GOOGLE') {
            userResponse = await fetch('http://20.3.4.249/api/users/me', {
                headers: getAuthHeadersGoogle()
            });
        } else {
            throw new Error('Proveedor de autenticación no reconocido');
        }

        if (!userResponse.ok) {
            throw new Error('Error al cargar la información del usuario.');
        }
        const encryptedData = await userResponse.text();
        const decryptedData = decryptData(encryptedData); // Cambié el nombre de la variable
        const userData = JSON.parse(decryptedData);       
        montoElement.textContent = "$ " + (userData.temporaryMoney ? formatMoney(userData.temporaryMoney) : '0');
    } catch (error) {
        console.error('Error al obtener el dinero:', error);
        const montoElement = document.querySelector('.total-amount span');
        montoElement.textContent = '$ 0';

        // Opcional: mostrar un mensaje de error al usuario
        Swal.fire({
            title: 'Error',
            text: 'No se pudo cargar el saldo',
            icon: 'error',
            confirmButtonColor: '#ccb043'
        });
    }
}
log_icon.addEventListener("click", () => {
    Swal.fire({
        title: "Are you sure?",
        text: "Your session will be closed!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ccb043",
        iconColor: "#ccb043",
        color: "#fff",
        cancelButtonColor: "#d33",
        background: "#252525",
        heightAuto: false,
        confirmButtonText: "Yes, get me out!",
    }).then((result) => {
        if (result.isConfirmed) {
            document.body.setAttribute("transition-style", "out:circle:hesitate");
            sessionStorage.clear();
            // Espera el tiempo de la animación antes de redirigir
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 2500); // 2500ms es el tiempo de la animación
        }
    });
});
const encodedKey = "cHVrb2puYzEyMzQ1Njc4OQ=="; 
const SECRET_KEY = atob(encodedKey); 
palanca.addEventListener("click", () => {
    let body = document.body;
    body.classList.toggle("dark-mode");
    circulo.classList.toggle("prendido");
});
puko.addEventListener("click", () => {
    barraLateral.classList.toggle("mini-barra-lateral");
    main.classList.toggle("min-main");
    edit_btn.classList.toggle("oculto");
    spans.forEach((span) => {
        span.classList.toggle("oculto");
    })
});
avaliable_auction.addEventListener("click", () => {
    window.location.href = "/html/avaliable_auction.html";
});
function formatMoney(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
document.addEventListener("DOMContentLoaded", () => {
    // Verificar si authCredentials existe en sessionStorage
    if (!sessionStorage.getItem('authToken')) {
        // Redirigir al index.html si no está autenticado
        Swal.fire({
            title: "Who are you?",
            text: "Please log in again",
            icon: "question",
            color: "#fff",
            iconColor: "#dcdcdc",
            heightAuto: false,
            background: "#252525",
            confirmButtonColor: "#ccb043"
        }).then(() => {
            sessionStorage.clear();
            window.location.href = '/index.html';
        });

    }

    // Obtener el valor del nombre desde sessionStorage
    let username = sessionStorage.getItem('username');
    fetchUserMoney();

    if (username) {
        username = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
    }
    // Seleccionar el elemento span con la clase 'nombre'
    const nombreElement = document.querySelector('.nombre');

    // Establecer el texto del span al valor de username si existe
    if (nombreElement) {
        nombreElement.textContent = username || 'Usuario no definido';

    }
    
});
