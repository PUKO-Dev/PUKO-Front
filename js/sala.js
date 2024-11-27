
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

// Función para obtener headers de autenticación
function getAuthHeaders() {
    const credentials = sessionStorage.getItem('authCredentials');
    return {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
    };
}
/* function convertDurationToSeconds(duration) {
    console.log(duration);
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
} */
const mainRoom = document.getElementById("main_room");
mainRoom.style.display = "none";
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

        const auctionResponse = await fetch(`https://puko-back-b7ebdyd4gsh6hvch.centralus-01.azurewebsites.net/api/auctions/${auctionId}`, {
            headers: getAuthHeaders()
        });
        if (!auctionResponse.ok) throw new Error('Error al cargar los datos de la subasta.');

        const auctionData = await auctionResponse.json();
        const articleId = auctionData.articleId;

        // Segunda consulta: Obtener detalles del artículo
        const articleResponse = await fetch(`https://puko-back-b7ebdyd4gsh6hvch.centralus-01.azurewebsites.net/api/articles/${articleId}/with-image`, {
            headers: getAuthHeaders()
        });
        if (!articleResponse.ok) throw new Error('Error al cargar los detalles del artículo.');

        const articleData = await articleResponse.json();

        // Quinta consulta: Obtener el ranking de pujas
        const rankingResponse = await fetch(`https://puko-back-b7ebdyd4gsh6hvch.centralus-01.azurewebsites.net/api/auctions/${auctionId}/top-bids`, {
            headers: getAuthHeaders()
        });
        if (!rankingResponse.ok) throw new Error('Error al cargar el ranking de pujas.');
        Creator = auctionData.creatorId === userId;
        const rankingData = await rankingResponse.json();
        // Mapea los datos para tu aplicación
        const auctionDetails = {
            id: auctionData.id,
            creator: auctionData.creatorId,
            title: articleData.name,
            img: articleData.mainImage,
            duration: auctionData.duration,
            status: auctionData.status,
            ranking: rankingData,
            monto: temporaryMoney,
            initialPrice: articleData.initialPrice,
            isCreator: auctionData.creatorId === userId
        };

        // Llama a la función que procesa y muestra los datos
        mainRoom.style.display = "block";
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

    const pujaContainer = document.getElementById("pujaContainer");
    const lineaDiv = document.getElementById("lineaDiv");
    const auctionId = sessionStorage.getItem('idRoom');

    // Verificación si el usuario es el creador de la subasta y el estado de la subasta
    if (data.isCreator) {
        if (data.status !== "ACTIVE") {
            // Mostrar botón de iniciar subasta si es el creador y la subasta no está activa
            pujaContainer.style.display = "none";
            iniciarSalaBtn.style.display = "block";
            finalizarSalaBtn.style.display = "none";
            lineaDiv.style.display = "none";
            iniciarSalaBtn.disabled = false;
            iniciarSalaBtn.style.backgroundColor = "";
            iniciarSalaBtn.style.cursor = "pointer";

            // Asociar el evento de inicio de la subasta al botón iniciar
            iniciarSalaBtn.addEventListener("click", () => {
                iniciarSalaBtn.disabled = true;
                iniciarSalaBtn.style.backgroundColor = "grey";
                iniciarSalaBtn.style.cursor = "not-allowed";

                // Realizar la solicitud para iniciar la subasta
                //fetch(`http://localhost:8080/api/auctions/${auctionId}/start`, { method: 'POST', headers: getAuthHeaders() })
                fetch(`https://puko-back-b7ebdyd4gsh6hvch.centralus-01.azurewebsites.net/api/auctions/${auctionId}/start`, { method: 'POST', headers: getAuthHeaders() })
                    .then(response => {
                        if (response.ok) {
                            // Actualizar la UI una vez que la subasta ha iniciado
                            iniciarSalaBtn.style.display = "none"; // Ocultar botón de iniciar
                            finalizarSalaBtn.style.display = "block"; // Mostrar botón de finalizar
                            document.getElementById("tiempoMin").style.display = "block";
                            initializeAuctionPage({ ...data, status: "ACTIVE" }); // Actualizar la vista
                        } else {
                            iniciarSalaBtn.disabled = false;
                            iniciarSalaBtn.style.backgroundColor = "";
                            iniciarSalaBtn.style.cursor = "pointer";
                        }
                    });
            });
        } else {
            // Mostrar botón de finalizar subasta si es el creador y la subasta está activa
            pujaContainer.style.display = "none";
            iniciarSalaBtn.style.display = "none";
            finalizarSalaBtn.style.display = "block";
            lineaDiv.style.display = "none";

            finalizarSalaBtn.addEventListener("click", () => {
                finalizarSalaBtn.disabled = true;
                finalizarSalaBtn.style.backgroundColor = "grey";
                finalizarSalaBtn.style.cursor = "not-allowed";

                // Realizar la solicitud para finalizar la subasta
                //fetch(`http://localhost:8080/api/auctions/${auctionId}/finalize`, { method: 'POST', headers: getAuthHeaders() })
                fetch(`https://puko-back-b7ebdyd4gsh6hvch.centralus-01.azurewebsites.net/api/auctions/${auctionId}/finalize`, { method: 'POST', headers: getAuthHeaders() })
                    .then(response => {
                        if (response.ok) { /* empty */ } else {

                            finalizarSalaBtn.disabled = false;
                            finalizarSalaBtn.style.backgroundColor = "";
                            finalizarSalaBtn.style.cursor = "pointer";
                        }
                    });
            });
        }
    } else {
        // Mostrar el contenedor de pujas para los no creadores o cuando la subasta esté activa
        pujaContainer.style.display = "flex";
        iniciarSalaBtn.style.display = "none";
        finalizarSalaBtn.style.display = "none";
        lineaDiv.style.display = "block";
    }

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
                <span class="username">${rank.username}</span>
                <span class="amount">${Math.floor(rank.amount).toLocaleString('de-DE')}</span>
            `;
        } else {
            rankingItem.setAttribute('data-ranking', "-");
            rankingItem.innerHTML = `
                <span class="username">${rank.username}</span>
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
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const progressCircle = document.querySelector(".progress-circle");
progressCircle.style.strokeDasharray = CIRCUMFERENCE;

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
    const bidValue = bidInput.value.replace(/\./g, '');
    const auctionId = sessionStorage.getItem('idRoom');
    const monto = document.querySelector(".total-amount span").textContent;
    const dinero = monto.replace(/[\s$]/g, '').replace(/\./g, '');
    if (bidValue === "" || isNaN(bidValue) || Number(bidValue) <= 0) {
        Swal.fire({
            icon: "error",
            heightAuto: false,
            title: "Oops...",
            color: "#fff",
            background: "#252525",
            confirmButtonColor: "#f27474",
            text: "Enter a valid numeric value!",
        });
    } else {
        const bidValueNum = parseInt(bidValue, 10);
        const dineroNum = parseInt(dinero, 10);

        if (dineroNum < bidValueNum) {
            Swal.fire({
                icon: "error",
                heightAuto: false,
                title: "Oops...",
                color: "#fff",
                background: "#252525",
                confirmButtonColor: "#f27474",
                text: "You don't have enough money!",
            });
        } else {
            const bidData = { amount: bidValueNum };
            pujarBtn.disabled = true;
            pujarBtn.style.backgroundColor = "grey";
            pujarBtn.style.cursor = "not-allowed";
            try {
                //const response = await fetch(`http://localhost:8080/api/auctions/${auctionId}/bid`, {
                const response = await fetch(`https://puko-back-b7ebdyd4gsh6hvch.centralus-01.azurewebsites.net/api/auctions/${auctionId}/bid`, {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(bidData)
                });

                if (response.ok) {
                    try {
                        pujarBtn.disabled = false;
                        pujarBtn.style.backgroundColor = "#ccb043";
                        pujarBtn.style.cursor = "pointer";
                    } catch (error) {
                        console.error(error); // Manejo de errores
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        background: "#252525",
                        heightAuto: false,
                        title: 'Error sending bid',
                        color: "#fff",
                        confirmButtonColor: "#f27474",
                        text: "Please, try again with another amount, your offer must be higher than the current bid.",
                    });
                    pujarBtn.disabled = false;
                    pujarBtn.style.backgroundColor = "#ccb043";
                    pujarBtn.style.cursor = "pointer";
                }
            } catch (error) {
                console.error("Hubo un problema con la solicitud:", error);
            }

            // Limpiar el campo de entrada
            console.timeEnd("bidRequestTimer");
            bidInput.value = "";
        }
    }
}

// Event listener para el botón de puja
pujarBtn.addEventListener("click", handleBid);

// Event listener para el input, detectando Enter
bidInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        handleBid();
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
        });
    }
});

chatIcon.addEventListener("click", function () {
    chatIcon.classList.remove("show-notification");

    const time = document.querySelector(".time");
    const timeContainer = document.querySelector(".timer-container");
    const timeText = document.querySelector(".timer-text");
    const timeRemainingLabel = document.getElementById("timeRemainingLabel");

    chatPopup.style.display = chatPopup.style.display === "block" ? "none" : "block";
    isChatOpen = chatPopup.style.display === "block";

    time.classList.toggle("time_desplazado");
    timeContainer.classList.toggle("timer-container_desplazado");
    timeText.classList.toggle("timer-text_desplazado");

    // Ocultar o mostrar el "Time Remaining" label
    timeRemainingLabel.style.display = isChatOpen ? "none" : "block";
});
palanca.addEventListener("click", () => {
    let body = document.body;
    body.classList.toggle("dark-mode");
    circulo.classList.toggle("prendido");
});
puko.addEventListener("click", () => {

    barraLateral.classList.toggle("mini-barra-lateral");
    main.classList.toggle("min-main");
    chatPopup.classList.toggle("small");
    edit_btn.classList.toggle("oculto");
    spans.forEach((span) => {
        span.classList.toggle("oculto");
    });
});
exit_btn.addEventListener("click", () => {
    Swal.fire({
        title: "Are you sure?",
        text: "Your are leaving the auction room!",
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

            const mainElement = document.getElementById("main_room");

            // Ejemplo de cómo agregar la clase para iniciar la animación
            mainElement.setAttribute("transition-style", "out:circle:top-left");

            // Para eliminar el estilo después de la animación si es necesario
            mainElement.addEventListener('animationend', () => {
                mainElement.removeAttribute("transition-style");
            });
            sessionStorage.removeItem('idRoom');

            // Espera el tiempo de la animación antes de redirigir
            setTimeout(() => {
                window.location.href = "/html/home.html";
            }, 1000);
        }
    });
});

let stompClient = null;

// Función asincrónica para obtener los datos del usuario
async function fetchUserData() {
    try {
        const userResponse = await fetch('https://puko-back-b7ebdyd4gsh6hvch.centralus-01.azurewebsites.net/api/users/me', {
            headers: getAuthHeaders()
        });
        if (!userResponse.ok) throw new Error('Error al cargar la información del usuario.');

        const userData = await userResponse.json();
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



// Función para conectar al WebSocket
async function connectWebSocket() {
    try {
        const response = await fetch(`https://puko-back-b7ebdyd4gsh6hvch.centralus-01.azurewebsites.net/negotiate?id=${userId}`);
        //const response = await fetch(`http://localhost:8080/negotiate?id=${userId}`);
        const data = await response.json();

        // Crea una conexión WebSocket
        socket = new WebSocket(data.url, 'json.webpubsub.azure.v1');
        // Define los temas para el Web PubSub
        const auctionTopic = `auction-${auctionId}`;
        const chatTopic = `auction-${auctionId}-chat`;
        const timeTopic = `auction-${auctionId}-time`;

        socket.onopen = () => {
            console.log("Conectado a WebSocket");
            const joinMessageChat = {
                type: "joinGroup",
                group: chatTopic
            };
            const joinMessageAuction = {
                type: "joinGroup",
                group: auctionTopic
            }
            const joinMessageAuctionTime = {
                type: "joinGroup",
                group: timeTopic
            }
            socket.send(JSON.stringify(joinMessageAuctionTime));
            socket.send(JSON.stringify(joinMessageAuction));
            socket.send(JSON.stringify(joinMessageChat));
            fetchAuctionData();
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.group === chatTopic) {
                const chatMessage = message.data;
                if (!isChatOpen) {
                    chatIcon.classList.add("show-notification");
                } else {
                    chatIcon.classList.remove("show-notification");
                }
                displayMessage(chatMessage);
            } else if (message.group === auctionTopic) {

                const parsedMessage = message.data;
                console.log(parsedMessage);
                let firstRank = null;
                let firstUsername = null;
                switch (parsedMessage.eventType) {
                    case "BID_PLACED":
                        document.querySelector(".current-bid span").textContent = `$ ${formatMoney(parsedMessage.eventData)}`;
                        break;
                    case "RANKING_UPDATED":
                        firstRank = parsedMessage.eventData[0];
                        firstUsername = Object.keys(firstRank)[0];
                        topBid = firstRank[firstUsername];

                        if (firstUsername !== username && !Creator) {
                            showPopup();
                        }
                        generateRankingTopic(parsedMessage.eventData);
                        updatemoney();
                        break;
                    case "USER_REGISTERED":
                        generateRankingTopic(parsedMessage.eventData);
                        break;
                    case "AUCTION_FINALIZED":
                        handleAuctionFinalized(parsedMessage.eventData);
                        break;
                }
            } else if (message.group === timeTopic) {
                console.log(message.data);
                console.log(message.group);
                const timeMessage = message.data;
                timeRemaining = timeMessage.eventData;
                updateTimer();
            }
        };

        socket.onclose = (event) => {
            console.log("Conexión cerrada");
            console.log("Conexión WebSocket cerrada");
            console.log("Código de cierre:", event.code);
            console.log("Razón del cierre:", event);

        };

        socket.onerror = (error) => {
            console.error("Error en WebSocket:", error);

        };
    } catch (error) {
        console.error("Connection error:", error);
    }
}

function handleAuctionFinalized(eventData) {
    if (eventData !== null && eventData.id === userId) {
        Swal.fire({
            title: "You are the Winner!",
            width: 600,
            padding: "3em",
            color: "#fff",
            heightAuto: false,
            background: "#252525",
            confirmButtonColor: "#ccb043",
            backdrop: "url(/img/winner.gif)"
        }).then(() => triggerExitAction());
    } else if (eventData === null && Creator) {
        Swal.fire({
            title: "Nobody bid :(",
            width: 600,
            padding: "3em",
            color: "#fff",
            heightAuto: false,
            background: "#252525",
            confirmButtonColor: "#ccb043",
            backdrop: `url("/img/loser.gif") no-repeat 75% top`
        }).then(() => triggerExitAction());
    } else if (eventData !== null && eventData.id !== userId && Creator) {
        Swal.fire({
            title: `The winner is: ${eventData.username}!`,
            width: 600,
            padding: "3em",
            color: "#fff",
            footer: `The Auction closed at: ${formatMoney(topBid)}`,
            heightAuto: false,
            background: "#252525",
            confirmButtonColor: "#ccb043",
            backdrop: "url(/img/money.gif)"
        }).then(() => triggerExitAction());
    } else {
        Swal.fire({
            title: "Sorry, next time bid higher!",
            width: 600,
            padding: "3em",
            color: "#fff",
            heightAuto: false,
            background: "#252525",
            confirmButtonColor: "#ccb043",
            backdrop: `url("/img/loser.gif") right top no-repeat`
        }).then(() => triggerExitAction());
    }
}
// Función para manejar la acción de salida
function triggerExitAction() {
    const mainElement = document.getElementById("main_room");

    // Iniciar la animación
    mainElement.setAttribute("transition-style", "out:circle:top-left");

    // Eliminar el estilo después de la animación
    mainElement.addEventListener('animationend', () => {
        mainElement.removeAttribute("transition-style");
    });
    sessionStorage.removeItem('idRoom');
    // Redirigir después de la animación
    setTimeout(() => {
        window.location.href = "/html/home.html";
    }, 1000); // 1300 ms es el tiempo de la animación
}
async function updatemoney() {
    try {
        const userResponse = await fetch('https://puko-back-b7ebdyd4gsh6hvch.centralus-01.azurewebsites.net/api/users/me', {
            headers: getAuthHeaders()
        });
        if (!userResponse.ok) throw new Error('Error al cargar la información del usuario.');
        const userData = await userResponse.json();
        document.querySelector(".total-amount span").textContent = `$ ${formatMoney(userData.temporaryMoney)}`;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
// Función para enviar mensajes
function sendMessage(message) {
    const chatMessage = {
        username: username,
        message: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Estructura ajustada del mensaje, incluyendo 'data'
    const payload = {
        type: "sendToGroup",
        group: `auction-${auctionId}-chat`,
        data: chatMessage  // Agregar la propiedad 'data' con el mensaje
    };

    // Asegúrate de convertir el objeto JavaScript a un string JSON antes de enviarlo
    socket.send(JSON.stringify(payload));
}

function displayMessage(chatMessage) {
    const chatBody = document.querySelector('.chat-body');
    const messageDiv = document.createElement('div');

    // Agrega clase según si el mensaje es del usuario actual o de otro usuario
    if (chatMessage.username === username) {
        messageDiv.classList.add('user-message');
    } else {
        messageDiv.classList.add('other-message');
    }

    messageDiv.innerHTML = `
        <div class="message-header">
            ${chatMessage.username} - ${chatMessage.timestamp}
        </div>
        <div class="message-content">
            ${chatMessage.message}
        </div>
    `;

    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight; // Desplázate hacia abajo al añadir un mensaje
}

// Inicializar la conexión y los event listeners cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function () {
    // Conectar WebSocket
    connectWebSocket();
    if (!sessionStorage.getItem('authCredentials') || !sessionStorage.getItem('idRoom')) {
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
    // Event listener para el botón de enviar
    document.querySelector('.send-message').addEventListener('click', function () {
        const inputElement = document.querySelector('.chat-input');
        const message = inputElement.value.trim();

        if (message) {
            sendMessage(message);
            inputElement.value = '';
        }
    });

    // Event listener para enviar con Enter
    document.querySelector('.chat-input').addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            const message = this.value.trim();
            if (message) {
                sendMessage(message);
                this.value = '';
            }
        }
    });

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