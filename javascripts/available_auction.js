
const CryptoJS = require('crypto-js');
const Swal = require('sweetalert2');
const preb_btn = document.querySelector(".previous-page-btn");
const modalImageContainer = document.querySelector(".modal-image-container");
const auctionsContainer = document.getElementById("auctions-container");
const previousPageButton = document.getElementById("previous-page");
const nextPageButton = document.getElementById("next-page");
const subscribeBtn = document.querySelector(".subscribe-btn");
const enter_btn = document.querySelector(".enter-btn");
let currentPage = 1;
const renderedAuctions = new Set();
const itemsPerPage = 8;
let auctionsData = [];
let currentRealAuctionIndex = 0;

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

// Función para cargar las subastas disponibles
function getAuthHeaders() {
    const authToken = sessionStorage.getItem('authToken');
    return {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };
}
async function getRemainingTime(auctionId) {
    try {
        const response = await fetch(`${apiUrl}/auctions/${auctionId}/remaining-time`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Error al cargar el tiempo restante de la subasta.');
        const timeData = await response.json();
        return timeData; // Suponiendo que el tiempo se devuelve en segundos
    } catch (error) {
        console.error(error);
        return null; // Devuelve null en caso de error
    }
}

function getCurrentUserId() {
    return sessionStorage.getItem("userId");
}

async function loadAuctions() {
    const loadingElement = document.querySelector('.loading');
    const auctionsContainer = document.querySelector('.auctions');

    try {
        const currentUserId = parseInt(getCurrentUserId(), 10);

        const response = await fetch(`${apiUrl}/auctions/available`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) throw new Error('Error al cargar las subastas.');

        const encryptedData = await response.text();
        const decryptedData = decryptData(encryptedData);

        if (!decryptedData) {
            throw new Error("Los datos descifrados son nulos o inválidos.");
        }

        const data = JSON.parse(decryptedData);

        // Valida que los datos sean un array
        if (!Array.isArray(data)) {
            throw new Error("Los datos descifrados no son un array válido.");
        }

        if (data.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.classList.add("empty-message");
            emptyMessage.textContent = "No available auctions at the moment :(";
            auctionsContainer.appendChild(emptyMessage);
            return;
        }

        // Procesa cada subasta
        for (let auction of data) {
            const auctionData = await processAuctionData(auction, currentUserId);
            auctionsData.push(auctionData);
            renderAuctions(currentPage);
        }
    } catch (error) {
        console.error(error);
        Swal.fire({
            title: "Error",
            text: "Failed to load auctions. Please try again later.",
            icon: "error",
        });
    } finally {
        loadingElement.classList.remove('active');
    }
}



// Función separada para procesar una subasta
async function processAuctionData(auction, currentUserId) {
    if (!auction || typeof auction !== "object") {
        throw new Error("Los datos de la subasta no son válidos.");
    }

    if (!auction.id || !auction.title) {
        throw new Error(`Faltan propiedades requeridas en la subasta: ${JSON.stringify(auction)}`);
    }
    if (auction.bidRanking.length > 0) {
        const firstRankingEntry = auction.bidRanking[0];
        const firstUsername = Object.keys(firstRankingEntry)[0];
        const firstScore = firstRankingEntry[firstUsername];
        topBid = parseInt(firstScore, 10);
    }
    let currentBid = 0;
    return {
        id: auction.id,
        price: currentBid,
        creator: auction.creatorId,
        status: auction.status,
        startTime: auction.startTime,
        time: 0,
        isCreator: auction.creatorId === currentUserId,
        isOwner: auction.ownerId === currentUserId
    };
}
async function addAuction(auction, retries = 3) {
    const loadingElement = document.querySelector('.loading');
    loadingElement.classList.add('active');

    try {
        const processedAuction = await processAuctionData(auction, userId);
        auctionsData.push(processedAuction);
        renderAuctions(currentPage); // Renderiza solo la nueva subasta
    } catch (error) {
        console.error("Error procesando la nueva subasta:", error);
        if (retries > 0) {
            console.warn(`Reintentando agregar la subasta en 2 segundos... Intentos restantes: ${retries}`);
            setTimeout(() => addAuction(auction, retries - 1), 2000);
        } else {
            console.error("No se pudo agregar la subasta después de varios intentos.");
        }
    } finally {
        if (retries <= 0 || auctionsData.some(a => a.id === auction.id)) {
            loadingElement.classList.remove('active');
        }
    }
}

function updateAuction(auction, retries = 3) {
    try {
        const index = auctionsData.findIndex(a => a.id === auction);

        if (index !== -1) {
            auctionsData[index].status = "ACTIVE";
            renderAuctions(currentPage);
            if (currentRealAuctionIndex === auction) {
                let timeToView = "";
                if (auctionsData[index].time >= 3600) {
                    const hours = Math.floor(auctionsData[index].time / 3600);
                    const minutes = Math.floor((auctionsData[index].time % 3600) / 60);
                    timeToView = `Left Time: ${hours}h ${minutes}m`;
                } else {
                    const minutesLeft = Math.floor(auctionsData[index].time / 60);
                    timeToView = `Left Time: ${minutesLeft} min`;
                }
                document.getElementById("modal-status").textContent = "Active";
                document.getElementById("modal-status").classList.add("active-status");
                document.getElementById("modal-status").classList.remove("scheduled-status");
                document.getElementById("modal-time").textContent = timeToView;
            }
        } else if (retries > 0) {
            console.warn("La subasta no se encontró para actualizar. Reintentando...");
            setTimeout(() => updateAuction(auction, retries - 1), 2000);
        } else {
            console.warn("La subasta no se encontró después de varios intentos.");
        }
    } catch (error) {
        console.error("Error actualizando la subasta:", error);
    }
}
function updateAmountAuction(auction, retries = 3) {
    try {
        const index = auctionsData.findIndex(a => a.id === auction.auctionId);

        if (index !== -1) {
            auctionsData[index].price = auction.amount;
            renderAuctions(currentPage);
            if (currentRealAuctionIndex === auction.auctionId) {
                document.getElementById("modal-price").textContent = `${formatMoney(auction.amount)} COP`;
            }
        } else if (retries > 0) {
            console.warn("La subasta no se encontró para actualizar. Reintentando...");
            setTimeout(() => updateAuction(auction, retries - 1), 2000);
        } else {
            console.warn("La subasta no se encontró después de varios intentos.");
        }
    } catch (error) {
        console.error("Error actualizando la subasta:", error);
    }
}

function deleteAuction(auction, retries = 3) {
    try {
        const index = auctionsData.findIndex(a => a.id === auction);

        if (index !== -1) {
            auctionsData.splice(index, 1);
            renderAuctions(currentPage);
        } else if (retries > 0) {
            console.warn("La subasta no se encontró para eliminar. Reintentando...");
            setTimeout(() => deleteAuction(auction, retries - 1), 2000);
        } else {
            console.warn("La subasta no se encontró después de varios intentos.");
        }
    } catch (error) {
        console.error("Error eliminando la subasta:", error);
    }
}
function convertDurationToSeconds(duration) {
    // Inicializar el total de segundos
    let totalSeconds = 0;

    // Expresión regular para capturar las horas, minutos y segundos
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;

    // Ejecutar la expresión regular en la duración
    const matches = duration.match(regex);

    if (matches) {
        const hours = parseInt(matches[1], 10) || 0; // Captura horas
        const minutes = parseInt(matches[2], 10) || 0; // Captura minutos
        const seconds = parseInt(matches[3], 10) || 0; // Captura segundos

        // Convertir a segundos
        totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    }

    return totalSeconds;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1; // Los meses en JavaScript son 0-indexados
    const year = date.getFullYear().toString().slice(-2); // Tomamos los últimos dos dígitos del año
    const hours = date.getHours().toString().padStart(2, '0'); // Asegura dos dígitos
    const minutes = date.getMinutes().toString().padStart(2, '0'); // Asegura dos dígitos

    return `${day}/${month}/${year} - ${hours}:${minutes}`;
}
// Renderizar subastas
const auctionTimeAssigned = new Set();

function renderAuctions(page) {
    auctionsContainer.innerHTML = "";
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const auctionsToDisplay = auctionsData.slice(start, end);

    auctionsToDisplay.forEach((auction, index) => {
        const auctionDiv = document.createElement("div");
        auctionDiv.classList.add("auction-item");

        // Añade animación solo si no ha sido renderizado antes
        if (!renderedAuctions.has(auction.id)) {
            auctionDiv.classList.add("first-time-animation"); // clase CSS para animación
            renderedAuctions.add(auction.id);

        }

        const globalIndex = start + index;

        // Verificar si el tiempo ya ha sido asignado antes para esta subasta
        let timeText = "";
        if (!auctionTimeAssigned.has(auction.id)) {
            // Asignar el tiempo solo la primera vez
            timeText = auction.status === 'ACTIVE' ? `Left Time: ${Math.floor(auction.time / 60)} min` : formatDate(auction.startTime);
            auctionTimeAssigned.add(auction.id); // Marcar que ya se asignó el tiempo
        } else {
            // Si ya fue asignado, solo mostrar el valor actual
            timeText = auction.status === 'ACTIVE' ? `Left Time: ${Math.floor(auction.time / 60)} min` : formatDate(auction.startTime);
        }

        auctionDiv.innerHTML = `
            <div class="auction-image-container">
                <img src="${auction.image}" alt="${auction.title}" class="auction-image">
            </div>
            <h3>${auction.title}</h3>
            <p>${formatMoney(auction.price)} COP</p>
            <span class="${auction.status === 'ACTIVE' ? 'active' : 'scheduled'}">${auction.status.charAt(0).toUpperCase() + auction.status.slice(1).toLowerCase()}</span>
            <p class="time-remaining">${timeText}</p>
        `;
        if (auction.status === 'ACTIVE') {
            startTimer(auctionDiv, auction.id);
        }


        auctionDiv.addEventListener("click", () => showModal(auction, globalIndex));
        auctionsContainer.appendChild(auctionDiv);
    });

    nextPageButton.style.display = end < auctionsData.length ? "block" : "none";
    previousPageButton.disabled = page === 1;

    if (page !== 1) {
        preb_btn.classList.add("active"); // Cambiar el CSS si no es la primera página
    } else {
        preb_btn.classList.remove("active"); // Restablecer el CSS si es la primera página
    }

    nextPageButton.style.display = end < auctionsData.length ? "block" : "none";
    previousPageButton.disabled = page === 1;
}
function startTimerForModal() {
    console.log("hola");
}


async function showModal(auction, index) {
    currentAuctionIndex = index;
    currentRealAuctionIndex = auction.id;
    currentImageIndex = 0;

    

    

    try {
        // Actualizar contenido del modal
        modalImageContainer.style.backgroundImage = `url(${auction.image})`;
        document.getElementById("modal-title").textContent = auction.title;
        document.getElementById("modal-price").textContent = `${formatMoney(auction.price)} COP`;
        document.getElementById("modal-status").textContent = auction.status.charAt(0).toUpperCase() + auction.status.slice(1).toLowerCase();

        // Configurar visualización del tiempo o estado
        if (auction.status === 'ACTIVE') {
            document.getElementById("modal-status").classList.add("active-status");
            document.getElementById("modal-status").classList.remove("scheduled-status");

            // Iniciar la actualización en tiempo real
            startTimerForModal();
        } else {
            document.getElementById("modal-status").classList.add("scheduled-status");
            document.getElementById("modal-status").classList.remove("active-status");
            document.getElementById("modal-time").textContent = formatDate(auction.startTime);
        }

        // Configurar botones de interacción según el estado de suscripción
        if (auction.isCreator) {
            setButtonStyles(enter_btn, "block", "#ccb043", false);
        } else {
            const isSubscribed = await checkSubscription(auction.id);
            if (isSubscribed) {
                showPopup();
                setButtonStyles(enter_btn, "block", "#ccb043", auction.status !== "ACTIVE");
            } else {
                setButtonStyles(subscribeBtn, "block", "#ccb043", false);
            }

            if (auction.status !== "ACTIVE" && isSubscribed) {
                setButtonStyles(enter_btn, "block", "grey", false);
            }
        }
    } catch (error) {
        console.error('Error al mostrar los datos del modal:', error);
    }
}

function startTimer(auctionDiv, index) {
    console.log(auctionDiv+index);
    
}

function formatMoney(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

async function checkSubscription(auctionId) {
    try {
        const response = await fetch(`${apiUrl}/auctions/registered`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Error al cargar las subastas registradas.');

        const registeredAuctions = await response.json();
        // Verifica si el auctionId está en la lista de subastas registradas
        return registeredAuctions.some(auction => auction.id === auctionId);
    } catch (error) {
        console.error('Error en la verificación de suscripción:', error);
        return false; // Devuelve false en caso de error
    }
}
// Función para suscribirse a una subasta
async function subscribeToAuction(auctionId) {

    try {
        const response = await fetch(`${apiUrl}/auctions/${auctionId}/register`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Error al suscribirse a la subasta.');
        }

        const result = await response.json(); // Puedes procesar la respuesta si es necesario


        return result; // Devuelve el resultado si es necesario
    } catch (error) {
        console.error('Error en la suscripción:', error);
        return null; // Devuelve null en caso de error
    }
}
let socket;

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
    loadAuctions, processAuctionData, addAuction, updateAuction, getRemainingTime
    ,updateAmountAuction, convertDurationToSeconds, formatDate, showModal, subscribeToAuction
    ,checkSubscription
}