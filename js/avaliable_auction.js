const puko = document.getElementById("puko");
const barraLateral = document.querySelector(".barra-lateral");
const spans = document.querySelectorAll("span");
const palanca = document.querySelector(".switch");
const circulo = document.querySelector(".circulo");
const menu = document.querySelector(".menu");
const main = document.querySelector("main");
const edit_btn = document.querySelector(".editUser");
const btn_close_modal = document.getElementById("cerrarPopUp");
const preb_btn = document.querySelector(".previous-page-btn");
const modalImageContainer = document.querySelector(".modal-image-container");
const subscribe_btn = document.querySelector(".subscribe-btn");
const auctionsContainer = document.getElementById("auctions-container");
const previousPageButton = document.getElementById("previous-page");
const nextPageButton = document.getElementById("next-page");
const btnCloseModal = document.getElementById("cerrarPopUp");
const subscribeBtn = document.querySelector(".subscribe-btn");
const log_icon = document.querySelector(".logOut-icon");
const enter_btn = document.querySelector(".enter-btn");
let currentPage = 1;
let UserId;
const renderedAuctions = new Set();
const itemsPerPage = 8;
let auctionsData = [];
let currentAuctionIndex = 0;
let currentImageIndex = 0;
let currentRealAuctionIndex = 0;
let topBid = 0;

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
nextPageButton.style.display = "none";
async function loadAuctions() {
    const loadingElement = document.querySelector('.loading');
    loadingElement.classList.add('active'); // Muestra el indicador de carga

    try {
        const currentUserId = parseInt(getCurrentUserId(), 10);

        const response = await fetch(`${apiUrl}/auctions/available`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar las subastas.');

        const data = await response.json();

        if (data.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.classList.add("empty-message");
            emptyMessage.textContent = "No available auctions at the moment :(";
            auctionsContainer.appendChild(emptyMessage);
        }
        // Procesa cada subasta y muestra de inmediato
        for (let auction of data) {
            const auctionData = await processAuctionData(auction, currentUserId);
            auctionsData.push(auctionData); // Añade la subasta al array de datos
            renderAuctions(currentPage); // Renderiza tras añadir cada subasta
        }

    } catch (error) {
        console.error(error);

    } finally {
        loadingElement.classList.remove('active'); // Oculta el indicador de carga
    }
}

// Función separada para procesar una subasta
async function processAuctionData(auction, currentUserId) {
    if (auction.bidRanking.length > 0) {
        const firstRankingEntry = auction.bidRanking[0];
        const firstUsername = Object.keys(firstRankingEntry)[0];
        const firstScore = firstRankingEntry[firstUsername];
        topBid = parseInt(firstScore, 10);
    }
    const articleDetails = await loadArticleDetails(auction.articleId);
    let currentBid = 0;
    currentBid = topBid > articleDetails.initialPrice ? topBid : articleDetails.initialPrice;
    return {
        id: auction.id,
        title: articleDetails.name,
        price: currentBid,
        image: articleDetails.mainImage,
        creator: auction.creatorId,
        status: auction.status,
        startTime: auction.startTime,
        time: 0,
        additionalImages: articleDetails.additionalImages || [],
        isCreator: auction.creatorId === currentUserId
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
// Función para cargar los detalles de un artículo
async function loadArticleDetails(articleId) {
    const response = await fetch(`${apiUrl}/articles/${articleId}/with-image`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al cargar los detalles del artículo.');
    return await response.json();
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
    const modalTimeElement = document.getElementById("modal-time");
    socket.addEventListener('message', function handleModalMessage(event) {
        const message = JSON.parse(event.data);

        // Filtrar los mensajes del grupo específico
        if (message.group === `auction-${currentRealAuctionIndex}-time`) {
            const parsedMessage = message.data;
            let timeRemaining = parsedMessage.eventData;
            const hours = Math.floor(timeRemaining / 3600);
            const minutes = Math.floor((timeRemaining % 3600) / 60);
            
            if (timeRemaining >= 3600) {
                modalTimeElement.textContent = `Left Time: ${hours}h ${minutes}m`;
            } else {
                modalTimeElement.textContent = `Left Time: ${Math.floor(timeRemaining / 60)} min`;
            }
        }
    });
}


async function showModal(auction, index) {
    currentAuctionIndex = index;
    currentRealAuctionIndex = auction.id;
    currentImageIndex = 0;
    document.getElementById("auctionModal").style.display = "flex";

    const loadingText = document.getElementById("loadingText");
    loadingText.textContent = "Loading...";
    loadingText.style.display = "block"; // Mostrar texto de carga

    // Ocultar botones de interacción durante la carga
    subscribeBtn.style.display = "none";
    enter_btn.style.display = "none";

    

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
    } finally {
        loadingText.style.display = "none"; // Ocultar texto de carga después de que se complete la carga
    }
}

function closeModal() {
    document.getElementById("auctionModal").style.display = "none";
}

function setButtonStyles(button, display, backgroundColor, disabled) {
    button.style.display = display;
    button.style.backgroundColor = backgroundColor;
    button.disabled = disabled;
}
function startTimer(auctionDiv, index) {
    const timeRemainingElement = auctionDiv.querySelector(".time-remaining");
    const joinMessageAuctionTime = {
        type: "joinGroup",
        group: `auction-${index}-time`
    }
    socket.send(JSON.stringify(joinMessageAuctionTime));
    socket.addEventListener('message', function handleMessage(event) {
        const message = JSON.parse(event.data);
        if (message.group === `auction-${index}-time`) {
            const parsedMessage = message.data;
            let timeRemaining = parsedMessage.eventData;
            const hours = Math.floor(timeRemaining / 3600);
            const minutes = Math.floor((timeRemaining % 3600) / 60);
            timeRemainingElement.textContent = `Left Time: ${hours}h ${minutes}m`;
        }
    });
}

function formatMoney(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Cerrar modal
btnCloseModal.addEventListener("click", () => {
    closeModal();
    socket.send(JSON.stringify({
        type: "joinGroup",
        group: `auction-${currentRealAuctionIndex}-time`
    }));
    document.getElementById("auctionModal").style.display = "none";
});
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
// Eventos para botones de paginación
nextPageButton.addEventListener("click", () => {
    currentPage++;
    renderAuctions(currentPage);
});

previousPageButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderAuctions(currentPage);
    }
});
enter_btn.addEventListener("click", () => {
    const auction = auctionsData[currentAuctionIndex];
    if (auction.status === "ACTIVE" || auction.isCreator) {
        sessionStorage.setItem('idRoom', auction.id);
        window.location.href = "/html/sala.html"; // Redirigir a la sala
    } else {
        Swal.fire({
            title: "Auction it's not available yet.",
            width: 600,
            padding: "3em",
            color: "#fff",
            heightAuto: false,
            background: "#252525",
            confirmButtonColor: "#ccb043",
            backdrop: `
              url("https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZDh5eGNnd3hubjkza2t0aDcxbjIzajRkeXc4c2l5MzkyZ2VveWQwayZlcD12MV9pbnRlcm5naWZfYnlfaWQmY3Q9cw/pauLTToDjXbfn2aaGv/giphy.gif")
              right top
              no-repeat
            `
        }).then(() => {
            document.getElementById("auctionModal").style.display = "none";
        });
    }
})

subscribeBtn.addEventListener("click", async () => {
    const auction = auctionsData[currentAuctionIndex]; // Obtener la subasta actual

    const result = await Swal.fire({
        title: "Subscribe to this auction?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#ccb043",
        iconColor: "#ccb043",
        color: "#fff",
        cancelButtonColor: "#d33",
        background: "#252525",
        heightAuto: false,
    });

    if (result.isConfirmed) {
        if (auction.status === "ACTIVE") {
            await subscribeToAuction(auction.id);
            sessionStorage.setItem('idRoom', auction.id);

            await Swal.fire({
                icon: "success",
                heightAuto: false,
                title: "Successful Subscription!",
                color: "#fff",
                showConfirmButton: false,
                background: "#252525",
                timer: 1500
            });

            window.location.href = "/html/sala.html"; // Redirigir a la sala
        } else {
            await subscribeToAuction(auction.id);

            await Swal.fire({
                title: "Successful Subscription!",
                text: "Come back when the auction starts",
                icon: "success",
                color: "#fff",
                heightAuto: false,
                background: "#252525",
                confirmButtonColor: "#ccb043"
            }).then(() => {
                closeModal();
                socket.send(JSON.stringify({
                    type: "joinGroup",
                    group: `auction-${currentRealAuctionIndex}-time`
                }));
                document.getElementById("auctionModal").style.display = "none";
            });


        }
    }
});
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
// Cargar y renderizar subastas en la primera carga
document.addEventListener("DOMContentLoaded", async () => {
    try {
        userId = getCurrentUserId(); //NOSONAR
        userId = getCurrentUserId(); //NOSONAR
        const response = await fetch(`http://20.3.4.249/negotiate?id=${userId}`); //NOSONAR
        //const response = await fetch(http://localhost:8080/negotiate?id=${userId});
        const encryptedData = await response.text();  // Obtener los datos cifrados
        // Desencripta los datos recibidos
        const decryptedData = decryptData(encryptedData);
        // Convierte la respuesta desencriptada en un objeto JSON
        const data = JSON.parse(decryptedData);
        socket = new WebSocket(data.url, 'json.webpubsub.azure.v1');

        socket.onopen = () => {
            console.log("Conectado a WebSocket");
            const joinGroupAuctions = {
                type: "joinGroup",
                group: "auctions"
            };
            socket.send(JSON.stringify(joinGroupAuctions));
        };
        socket.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            const parsedMessage = message.data;

            if (message.group === "auctions") {
                if (parsedMessage.eventType === "AUCTION_CREATED") {
                    addAuction(parsedMessage.eventData);
                }
                if (parsedMessage.eventType === "AUCTION_STARTED") {
                    console.log("Al Actualizar "+parsedMessage.eventData);
                    updateAuction(parsedMessage.eventData);
                }
                if (parsedMessage.eventType === "AUCTION_FINALIZED") {
                    console.log("Al Borrar "+parsedMessage.eventData);
                    deleteAuction(parsedMessage.eventData);
                }
                if (parsedMessage.eventType === "NEW_TOP_BID") {
                    updateAmountAuction(parsedMessage.eventData);
                }
            }
        });


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
        if (username) {
            username = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
        }

        // Seleccionar el elemento span con la clase 'nombre'
        const nombreElement = document.querySelector('.nombre');

        // Establecer el texto del span al valor de username si existe
        if (nombreElement) {
            nombreElement.textContent = username || 'Usuario no definido';
        }
        loadAuctions();
    } catch (error) {
        console.error("Error al inicializar el WebSocket:", error);
    }
});
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
const popup = document.getElementById("popup");

// Función para mostrar el popup
function showPopup() {
    popup.classList.add("show"); // Añadir la clase 'show' para mostrar el popup

    // Cerrar el popup después de 2 segundos
    setTimeout(function () {
        popup.classList.remove("show"); // Eliminar la clase 'show' para ocultarlo
    }, 2000); // 2000 ms = 2 segundos
}
