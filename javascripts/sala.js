// Variables y elementos de la interfaz
const puko = document.getElementById("puko");
const barraLateral = document.querySelector(".barra-lateral");
const spans = document.querySelectorAll("span");
const palanca = document.querySelector(".switch");
const circulo = document.querySelector(".circulo");
const menu = document.querySelector(".menu");
const main = document.querySelector("main");
const edit_btn = document.querySelector(".editUser");
const exit_btn = document.querySelector(".exit-button");
const pujarBtn = document.querySelector(".bid-button");
const chatPopup = document.getElementById("chatPopup");
const chatIcon = document.querySelector(".chat ion-icon");
const iniciarSalaBtn = document.getElementById("iniciarSalaBtn");
const finalizarSalaBtn = document.getElementById("finalizarSalaBtn");
const bidInput = document.querySelector('.bid-input');
const auctionId = sessionStorage.getItem('idRoom');
let userData;
let myname;
let Creator = false;
let isChatOpen = false;
let topBid;
let TOTAL_TIME;
let timeRemaining;
//NOSONAR
const apiUrl = 'http://20.3.4.249/api'; //NOSONAR
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
function getAuthHeaders() {
    const authToken = sessionStorage.getItem('authToken');
    return {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };
}
const mainRoom = document.getElementById("main_room");

// Función para obtener datos de la subasta
async function fetchAuctionData() {
    const auctionId = sessionStorage.getItem('idRoom');
    const loadingElement = document.querySelector('.loading');
    loadingElement.classList.add('active');
    if (!auctionId) {
        console.error("No se encontró el idRoom en sessionStorage.");
        return;
    }

    try {
        // Primera consulta: Obtener datos de la subasta

        const auctionResponse = await fetch(`${apiUrl}/auctions/${auctionId}`, {
            headers: getAuthHeaders()
        });
        if (!auctionResponse.ok) throw new Error('Error al cargar los datos de la subasta.');
        const encryptedData = await auctionResponse.text();
        const decryptedData = decryptData(encryptedData);
        const auctionData = JSON.parse(decryptedData);

        const articleId = auctionData.articleId;

        // Segunda consulta: Obtener detalles del artículo
        const articleResponse = await fetch(`${apiUrl}/articles/${articleId}/with-image`, {
            headers: getAuthHeaders()
        });
        if (!articleResponse.ok) throw new Error('Error al cargar los detalles del artículo.');

        const encryptedData2 = await articleResponse.text();
        const decryptedData2 = decryptData(encryptedData2);
        const articleData = JSON.parse(decryptedData2);


        // Mapea los datos para tu aplicación
        const auctionDetails = {
            id: auctionData.id,
            creator: auctionData.creatorId,
            title: articleData.name,
            img: articleData.mainImage,
            duration: auctionData.duration,
            status: auctionData.status,
            ranking: auctionData.bidRanking,
            monto: temporaryMoney,
            initialPrice: articleData.initialPrice,
            isCreator: auctionData.creatorId === userId
        };

        // Llama a la función que procesa y muestra los datos

        initializeAuctionPage(auctionDetails);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        loadingElement.classList.remove('active');
    }
}

// Configuración de la interfaz y temporizador
function initializeAuctionPage(data) {
    TOTAL_TIME = Math.floor(data.duration / 1000);


    generateRanking(data.ranking);

    // Mostrar temporizador si hay tiempo restante y la subasta está activa

    document.getElementById("time-remaining").innerHTML = "Not <br> Started";
    document.getElementById("tiempoMin").style.display = "none";
    const currentBidElement = document.querySelector(".current-bid span");
    if (data.ranking[0]?.amount && data.ranking[0].amount >= data.initialPrice) {
        currentBidElement.textContent = `$ ${formatMoney(data.ranking[0].amount)}`;
    } else {
        currentBidElement.textContent = `$ ${formatMoney(data.initialPrice)}`;
    }

    // Actualizar detalles del producto
    document.querySelector(".nombre-producto").textContent = data.title;
    document.querySelector(".total-amount span").textContent = `$ ${formatMoney(data.monto)}`;
    document.querySelector(".image-container-product").style.backgroundImage = `url(${data.img})`;
}

// Función para generar el ranking
function generateRanking(data) {
    const rankingList = document.querySelector(".ranking-list");
    const rankings = data;

    if (rankings.length > 0) {
        topBid = rankings[0].amount;
    }

    rankingList.innerHTML = '';

    rankings.forEach((rank, index) => {
        const rankingItem = document.createElement('li');
        rankingItem.classList.add('ranking-item');

        // Agregar clases especiales para los tres primeros puestos
        if (rankings[index] && rankings[index].amount > 0) {
            if (index === 0) {
                rankingItem.classList.add('top1');
            } else if (index === 1) {
                rankingItem.classList.add('top2');
            } else if (index === 2) {
                rankingItem.classList.add('top3');
            }

            rankingItem.setAttribute('data-ranking', index + 1);
            rankingItem.innerHTML = `
                <span class="username">${rank.userId}</span>
                <span class="amount">${Math.floor(rank.amount).toLocaleString('de-DE')}</span>
            `;
        } else {
            rankingItem.setAttribute('data-ranking', "-");
            rankingItem.innerHTML = `
                <span class="username">${rank.userId}</span>
                <span class="amount">-</span>
            `;
        }

        rankingList.appendChild(rankingItem);
    });
}

function generateRankingTopic(data) {
    const rankingList = document.querySelector(".ranking-list");

    rankingList.innerHTML = '';
    data.forEach((rank, index) => {
        const rankingItem = document.createElement('li');
        rankingItem.classList.add('ranking-item');

        if (data.length > 0) {
            const firstRank = data[0];
            const firstUsername = Object.keys(firstRank)[0];
            topBid = firstRank[firstUsername];
        }

        const username = Object.keys(rank)[0];
        const score = rank[username];

        // Asignar clases para los tres primeros puestos si el puntaje es mayor que 0
        if (score > 0) {
            if (index === 0) {
                rankingItem.classList.add('top1');
            } else if (index === 1) {
                rankingItem.classList.add('top2');
            } else if (index === 2) {
                rankingItem.classList.add('top3');
            }

            rankingItem.setAttribute('data-ranking', index + 1);
        } else {
            rankingItem.setAttribute('data-ranking', "-");
        }

        // Mostrar el nombre de usuario y el puntaje formateado
        rankingItem.innerHTML = `
            <span class="username">${username}</span>
            <span class="amount">${Math.floor(score).toLocaleString('de-DE')}</span>
        `;

        rankingList.appendChild(rankingItem);
    });
}
function formatMoney(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
// Inicialización del temporizador


function updateTimer() {

    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;

    const timeDisplay = document.getElementById("time-remaining");
    if (timeRemaining <= 3600) { // Menos o igual a una hora
        timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById("tiempoMin").textContent = "min";
    } else {
        timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    const offset = CIRCUMFERENCE * (1 - timeRemaining / TOTAL_TIME);
    progressCircle.style.strokeDashoffset = offset;

    if (timeRemaining > 0) {
        timeRemaining--;
    } else {
        clearInterval(timerInterval);
        timeDisplay.textContent = "0:00";
        pujarBtn.disabled = true;
        pujarBtn.style.backgroundColor = "grey";
        pujarBtn.style.cursor = "not-allowed";
    }
}



async function handleBid() {
    const bidValue = sanitizeInput(bidInput.value);
    const auctionId = sessionStorage.getItem('idRoom');
    const availableAmount = sanitizeInput(document.querySelector(".total-amount span").textContent);

    if (!isValidBid(bidValue)) {
        showAlert("error", "Oops...", "Enter a valid numeric value!");
        return;
    }

    if (!hasSufficientFunds(bidValue, availableAmount)) {
        showAlert("error", "Oops...", "You don't have enough money!");
        return;
    }

    await placeBid(auctionId, bidValue);
    resetBidInput();
}

// Sanitiza el valor eliminando puntos, espacios y otros caracteres no numéricos.
function sanitizeInput(value) {
    return value.replace(/[\s$.]/g, '').replace(/\./g, '');
}

// Valida que la oferta sea numérica, positiva y no esté vacía.
function isValidBid(value) {
    return value !== "" && !isNaN(value) && Number(value) > 0;
}

// Verifica si el monto disponible es suficiente para la oferta.
function hasSufficientFunds(bidValue, availableAmount) {
    return parseInt(availableAmount, 10) >= parseInt(bidValue, 10);
}

// Muestra alertas reutilizando un solo método para evitar redundancia.
function showAlert(icon, title, text) {
    Swal.fire({
        icon,
        heightAuto: false,
        title,
        text,
        color: "#fff",
        background: "#252525",
        confirmButtonColor: "#f27474",
    });
}

// Maneja el envío de la oferta al backend y la respuesta.
async function placeBid(auctionId, bidValue) {
    disableBidButton(true);

    const bidData = { amount: parseInt(bidValue, 10) };

    // Convierte el objeto a JSON antes de cifrar
    const encryptedData = CryptoJS.AES.encrypt(
        JSON.stringify(bidData),
        CryptoJS.enc.Utf8.parse("MySecretKey12345"),
        {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }
    ).toString();

    try {
        const response = await fetch(`${apiUrl}/auctions/${auctionId}/bid`, {
            method: "POST",
            headers: {
                ...getAuthHeaders(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ data: encryptedData }) // Enviando el dato cifrado
        });

        if (!response.ok) {
            showAlert("error", "Error sending bid", "Please try again with a higher amount.");
        }
    } catch (error) {
        showAlert("error", "Network Error", "Unable to place bid. Please try again later.");
    } finally {
        disableBidButton(false);
    }
}

// Desactiva y activa el botón de oferta para evitar múltiples solicitudes.
function disableBidButton(isDisabled) {
    pujarBtn.disabled = isDisabled;
    pujarBtn.style.backgroundColor = isDisabled ? "grey" : "#ccb043";
    pujarBtn.style.cursor = isDisabled ? "not-allowed" : "pointer";
}

// Restablece el campo de entrada después de enviar la oferta.
function resetBidInput() {
    bidInput.value = "";
}

// Event listener para el botón de puja
try {
    pujarBtn.addEventListener("click", handleBid);
} catch (error) {

}

try {
    // Event listener para el input, detectando Enter
    bidInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            handleBid();
        }
    });
} catch (error) {

}


try {
    palanca.addEventListener("click", () => {
        let body = document.body;
        body.classList.toggle("dark-mode");
        circulo.classList.toggle("prendido");
    });
} catch (error) {
    
}

try {
    puko.addEventListener("click", () => {

        barraLateral.classList.toggle("mini-barra-lateral");
        main.classList.toggle("min-main");
        chatPopup.classList.toggle("small");
        edit_btn.classList.toggle("oculto");
        spans.forEach((span) => {
            span.classList.toggle("oculto");
        });
    });
} catch (error) {
    
}


let stompClient = null;

// Función asincrónica para obtener los datos del usuario
async function fetchUserData() {
    try {
        const userResponse = await fetch(`${apiUrl}/users/me`, {
            headers: getAuthHeaders()
        });
        if (!userResponse.ok) throw new Error('Error al cargar la información del usuario.');
        const encryptedData = await userResponse.text();
        const decryptedData = decryptData(encryptedData);
        const userData = JSON.parse(decryptedData);
        return userData;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

let username;
let userId;
let temporaryMoney;
let socket;
// Llamar a la función asincrónica y establecer el usuario
fetchUserData().then(userData => {
    username = userData.username;
    userId = userData.id;
    temporaryMoney = userData.temporaryMoney;
}).catch(error => {
    console.error('Error al obtener el nombre de usuario:', error);
});


// Función para enviar mensajes
function sendMessage(message) {
    console.log(message);

    // Estructura ajustada del mensaje, incluyendo 'data'
 
}

const popup = document.getElementById("popup");

// Función para mostrar el popup
function showPopup() {
    popup.classList.add("show"); // Añadir la clase 'show' para mostrar el popup

    // Cerrar el popup después de 2 segundos
    setTimeout(function () {
        popup.classList.remove("show"); // Eliminar la clase 'show' para ocultarlo
    }, 2000); // 2000 ms = 2 segundos
}

module.exports = {
    formatMoney, hasSufficientFunds, isValidBid, decryptData, getAuthHeaders, fetchAuctionData, initializeAuctionPage, updateTimer, sanitizeInput, showPopup
}