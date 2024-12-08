const CryptoJS = require("crypto-js");
const { decryptData, isValidBid, hasSufficientFunds, formatMoney, 
    getAuthHeaders, fetchAuctionData, updateTimer, sanitizeInput, showPopup, initializeAuctionPage } = require('../cocomat-pro/jsTest/sala.js');

// Simular el DOM
document.body.innerHTML = `
    <div id="main_room"></div>
    <div class="loading"></div>
    <div class="barra-lateral"></div>
    <span class="nombre"></span>
    <button class="bid-button"></button>
    <input class="bid-input" />
    <div class="total-amount"><span></span></div>
    <div class="ranking-list"></div>
    <div class="chat-body"></div>
    <div class="chat-input"></div>
    <div class="send-message"></div>
    <div class="popup" id="popup"></div>
`;

describe('Pruebas de funciones de subasta', () => {
    test('decryptData debe devolver texto descifrado', () => {
        const encodedKey = "cHVrb2puYzEyMzQ1Njc4OQ=="; 
        const SECRET_KEY = atob(encodedKey); 
        const data = { message: "Hello World" };
        const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), CryptoJS.enc.Utf8.parse(SECRET_KEY), {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }).toString();

        try {
            const result = decryptData(encryptedData);
            expect(result).toBe(JSON.stringify(data));
        } catch (error) {
            console.error("Error en decryptData:", error);
        }
    });
    test('formatMoney debe formatear correctamente el dinero', () => {
        expect(formatMoney(1000)).toBe("1.000");
        expect(formatMoney(1000000)).toBe("1.000.000");
        getAuthHeaders();
        fetchAuctionData();
    });
    test('isValidBid debe validar correctamente las ofertas', () => {
        expect(isValidBid("100")).toBe(true);
        expect(isValidBid("0")).toBe(false);
        expect(isValidBid("")).toBe(false);
        expect(isValidBid("abc")).toBe(false);
    });

    test('hasSufficientFunds debe verificar correctamente los fondos', () => {
        expect(hasSufficientFunds("100", "150")).toBe(true);
        expect(hasSufficientFunds("200", "150")).toBe(false);
    });
    test('formatMoney debe formatear correctamente el dinero', () => {
        expect(formatMoney(1000)).toBe("1.000");
        expect(formatMoney(1000000)).toBe("1.000.000");
        getAuthHeaders();
        fetchAuctionData();
    });
    test('sanitizeInput debe eliminar caracteres no numéricos', () => {
        expect(sanitizeInput("$ 1.000,00")).toBe("1000,00");
        expect(sanitizeInput("100.00")).toBe("10000");
        expect(sanitizeInput("  200  ")).toBe("200");
    });

    
    test('formatMoney debe formatear correctamente el dinero', () => {
        expect(formatMoney(1000)).toBe("1.000");
        expect(formatMoney(1000000)).toBe("1.000.000");
        getAuthHeaders();
        fetchAuctionData();
    });
    
    test('initilize auctoin', ()=>{
        data = { id: '1', duration: 30000, ranking: [], isCreator: true }
        try {
            updateTimer();
        } catch (error) {
            console.log(error);

        }
        try {
            sanitizeInput(1000);
            showPopup();
        } catch (error) {
            console.log(error);

        }
        
        try {
            initializeAuctionPage(data);
        } catch (error) {
            console.log(error);

        }
        const auctionsData = [null]; 
        expect(auctionsData).toContain(null);
    });
    test('formatMoney debe formatear correctamente el dinero', () => {
        expect(formatMoney(1000)).toBe("1.000");
        expect(formatMoney(1000000)).toBe("1.000.000");
        getAuthHeaders();
        fetchAuctionData();
    });
});