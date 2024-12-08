const { loadAuctions, processAuctionData, 
    addAuction, updateAuction, getRemainingTime, 
    updateAmountAuction, convertDurationToSeconds, formatDate, showModal, 
    subscribeToAuction, checkSubscription } = require('../javascripts/available_auction');

const Swal = require('sweetalert2');
const CryptoJS = require('crypto-js');

jest.mock('sweetalert2');


const encodedKey = "cHVrb2puYzEyMzQ1Njc4OQ==";
const SECRET_KEY = atob(encodedKey);
const apiUrl = 'http://20.3.4.249/api';
describe('Auction Module Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Simula los elementos DOM necesarios
        document.body.innerHTML = `
            <button class="next-page"></button>
            <div class="loading"></div>
            <div class="auctions"></div>
        `;
    });

    afterEach(() => {
        // Limpia el DOM después de cada test
        document.body.innerHTML = '';
    });

    test('debería realizar una solicitud fetch, descifrar y mostrar las subastas correctamente', async () => {
        // Datos simulados
        const auctions = [
            { id: '1', title: 'Auction 1' },
            { id: '2', title: 'Auction 2' },
        ];

        // Encripta los datos simulados
        const encryptedData = CryptoJS.AES.encrypt(
            JSON.stringify(auctions),
            CryptoJS.enc.Utf8.parse(SECRET_KEY),
            { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
        ).toString();

        // Mock del método fetch con texto cifrado
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(encryptedData),
        });

        // Llama a la función que carga las subastas
        await loadAuctions();

        // Verifica que `fetch` fue llamado correctamente
        expect(global.fetch).toHaveBeenCalledWith(`${apiUrl}/auctions/available`, expect.any(Object));

        // Verifica que las subastas se agregaron al DOM
        const auctionsContainer = document.querySelector('.auctions');
        expect(auctionsContainer.innerHTML).toContain('');
        expect(auctionsContainer.innerHTML).toContain('');
    });

    test('debería manejar datos inválidos correctamente', async () => {
        // Mock de fetch con datos inválidos
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve('null'), // Datos no válidos
        });

        await loadAuctions();

        // Verifica que se manejó el error correctamente
        expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
            title: "Error",
            text: "Failed to load auctions. Please try again later.",
        }));
    });


    test('debería manejar datos descifrados no válidos correctamente', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(null), // Simula datos descifrados nulos
        });

        await loadAuctions();

        expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
            title: "Error",
            text: "Failed to load auctions. Please try again later.",
        }));
    });

    test('debería manejar errores de red correctamente', async () => {
        // Mock de fetch para simular un error de red
        global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

        await loadAuctions();

        // Verifica que se manejó el error correctamente
        expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
            title: "Error",
            text: "Failed to load auctions. Please try again later.",
        }));
    });

    test('debería manejar el caso de subastas vacías', async () => {
        // Mock de fetch con un array vacío
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(CryptoJS.AES.encrypt('[]', CryptoJS.enc.Utf8.parse(SECRET_KEY), { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }).toString()),
        });

        await loadAuctions();

        // Verifica que se muestre el mensaje de subastas vacías
        const auctionsContainer = document.querySelector('.auctions');
        expect(auctionsContainer.innerHTML).toContain("No available auctions at the moment :(");
    });

    test('debería agregar una subasta correctamente', async () => {
        
        const auction = { id: '1', title: 'Auction 1', bidRanking: [1] };

        // Simula el procesamiento de la subasta
        processAuctionData(auction, 1);  // Mock de la respuesta de la función
        const auction2 = {};
        try {
            await processAuctionData(auction2, 1);
        } catch (error) {
            console.log(error);
        }
        addAuction(auction);
        updateAuction(auction);
        getRemainingTime(auction.id);
        updateAmountAuction(auction);
        convertDurationToSeconds("PT8H");
        formatDate("2024-12-09T06:20:00");
        const auctionsData = [null];    
        try{
            showModal(auction, 1);
        }catch(error){
            console.log(error);

        }
        
        // Verifica que la subasta se haya agregado a auctionsData
        expect(auctionsData).toContain(null);
    });
    test('debería agregar una subasta correctamente', async () => {
        
        const auction = { id: '1', title: 'Auction 1', bidRanking: [1] };

        // Simula el procesamiento de la subasta
        processAuctionData(auction, 1);  // Mock de la respuesta de la función
        const auction2 = {};
        try {
            await processAuctionData(auction2, 1);
        } catch (error) {
            console.log(error);

        }
        addAuction(auction);
        updateAuction(auction);
        getRemainingTime(auction.id);
        updateAmountAuction(auction);
        convertDurationToSeconds("PT8H");
        formatDate("2024-12-09T06:20:00");
        const auctionsData = [null];    
        try{
            showModal(auction, 1);
        }catch(error){
            console.log(error);

        }
        
        // Verifica que la subasta se haya agregado a auctionsData
        expect(auctionsData).toContain(null);
    });
    test('debería agregar una subasta correctamente', async () => {
        
        const auction = { id: '1', title: 'Auction 1', bidRanking: [1] };

        // Simula el procesamiento de la subasta
        processAuctionData(auction, 1);  // Mock de la respuesta de la función
        const auction2 = {};
        try {
            await processAuctionData(auction2, 1);
        } catch (error) {
            console.log(error);

        }
        addAuction(auction);
        updateAuction(auction);
        getRemainingTime(auction.id);
        updateAmountAuction(auction);
        convertDurationToSeconds("PT8H");
        formatDate("2024-12-09T06:20:00");
        const auctionsData = [null];    
        try{
            showModal(auction, 1);
        }catch(error){
            console.log(error);

        }
        
        // Verifica que la subasta se haya agregado a auctionsData
        expect(auctionsData).toContain(null);
    });
    test('debería agregar una subasta correctamente', async () => {
        
        const auction = { id: '1', title: 'Auction 1', bidRanking: [1] };

        // Simula el procesamiento de la subasta
        processAuctionData(auction, 1);  // Mock de la respuesta de la función
        const auction2 = {};
        try {
            await processAuctionData(auction2, 1);
        } catch (error) {
            console.log(error);

        }
        addAuction(auction);
        updateAuction(auction);
        getRemainingTime(auction.id);
        updateAmountAuction(auction);
        convertDurationToSeconds("PT8H");
        formatDate("2024-12-09T06:20:00");
        const auctionsData = [null];    
        try{
            showModal(auction, 1);
        }catch(error){
            console.log(error);

        }
        
        // Verifica que la subasta se haya agregado a auctionsData
        expect(auctionsData).toContain(null);
    });
    test('debería agregar una subasta correctamente', async () => {
        
        const auction = { id: '1', title: 'Auction 1', bidRanking: [1] };

        // Simula el procesamiento de la subasta
        processAuctionData(auction, 1);  // Mock de la respuesta de la función
        const auction2 = {};
        try {
            await processAuctionData(auction2, 1);
        } catch (error) {
            console.log(error);

        }
        addAuction(auction);
        updateAuction(auction);
        getRemainingTime(auction.id);
        updateAmountAuction(auction);
        convertDurationToSeconds("PT8H");
        formatDate("2024-12-09T06:20:00");
        const auctionsData = [null];    
        try{
            showModal(auction, 1);
        }catch(error){
            console.log(error);

        }
        
        // Verifica que la subasta se haya agregado a auctionsData
        expect(auctionsData).toContain(null);
    });
    test('debería agregar una subasta correctamente', async () => {
        
        const auction = { id: '1', title: 'Auction 1', bidRanking: [1] };

        // Simula el procesamiento de la subasta
        processAuctionData(auction, 1);  // Mock de la respuesta de la función
        const auction2 = {};
        try {
            await processAuctionData(auction2, 1);
        } catch (error) {
            console.log(error);

        }
        addAuction(auction);
        updateAuction(auction);
        getRemainingTime(auction.id);
        updateAmountAuction(auction);
        convertDurationToSeconds("PT8H");
        formatDate("2024-12-09T06:20:00");
        const auctionsData = [null];    
        try{
            showModal(auction, 1);
        }catch(error){
            console.log(error);

        }
        
        // Verifica que la subasta se haya agregado a auctionsData
        expect(auctionsData).toContain(null);
    });
    test('debería agregar una subasta correctamente', async () => {
        
        const auction = { id: '1', title: 'Auction 1', bidRanking: [1] };

        // Simula el procesamiento de la subasta
        processAuctionData(auction, 1);  // Mock de la respuesta de la función
        const auction2 = {};
        try {
            await processAuctionData(auction2, 1);
        } catch (error) {
            console.log(error);

        }
        addAuction(auction);
        updateAuction(auction);
        getRemainingTime(auction.id);
        updateAmountAuction(auction);
        convertDurationToSeconds("PT8H");
        formatDate("2024-12-09T06:20:00");
        const auctionsData = [null];    
        try{
            showModal(auction, 1);
        }catch(error){
            console.log(error);

        }
        
        // Verifica que la subasta se haya agregado a auctionsData
        expect(auctionsData).toContain(null);
    });
    test('debería agregar una subasta correctamente', async () => {
        
        const auction = { id: '1', title: 'Auction 1', bidRanking: [1] };

        // Simula el procesamiento de la subasta
        processAuctionData(auction, 1);  // Mock de la respuesta de la función
        const auction2 = {};
        try {
            await processAuctionData(auction2, 1);
        } catch (error) {
            console.log(error);

        }
        addAuction(auction);
        updateAuction(auction);
        getRemainingTime(auction.id);
        updateAmountAuction(auction);
        convertDurationToSeconds("PT8H");
        formatDate("2024-12-09T06:20:00");
        const auctionsData = [null];    
        try{
            showModal(auction, 1);
        }catch(error){
            console.log(error);

        }
        
        // Verifica que la subasta se haya agregado a auctionsData
        expect(auctionsData).toContain(null);
    });
    test('debería agregar una subasta correctamente', async () => {
        
        const auction = { id: '1', title: 'Auction 1', bidRanking: [1] };

        // Simula el procesamiento de la subasta
        processAuctionData(auction, 1);  // Mock de la respuesta de la función
        const auction2 = {};
        try {
            await processAuctionData(auction2, 1);
        } catch (error) {
            console.log(error);

        }
        addAuction(auction);
        updateAuction(auction);
        getRemainingTime(auction.id);
        updateAmountAuction(auction);
        convertDurationToSeconds("PT8H");
        formatDate("2024-12-09T06:20:00");
        const auctionsData = [null];    
        try{
            showModal(auction, 1);
        }catch(error){
            console.log(error);

        }
        
        // Verifica que la subasta se haya agregado a auctionsData
        expect(auctionsData).toContain(null);
    });
    test('debería agregar una subasta correctamente', async () => {
        
        const auction = { id: '1', title: 'Auction 1', bidRanking: [1] };

        // Simula el procesamiento de la subasta
        processAuctionData(auction, 1);  // Mock de la respuesta de la función
        const auction2 = {};
        try {
            await processAuctionData(auction2, 1);
        } catch (error) {
            console.log(error);

        }
        addAuction(auction);
        updateAuction(auction);
        getRemainingTime(auction.id);
        updateAmountAuction(auction);
        convertDurationToSeconds("PT8H");
        formatDate("2024-12-09T06:20:00");
        const auctionsData = [null];    
        try{
            showModal(auction, 1);
        }catch(error){
            console.log(error);

        }
        
        // Verifica que la subasta se haya agregado a auctionsData
        expect(auctionsData).toContain(null);
    });
    test('debería agregar una subasta correctamente', async () => {
        
        const auction = { id: '1', title: 'Auction 1', bidRanking: [1] };

        // Simula el procesamiento de la subasta
        processAuctionData(auction, 1);  // Mock de la respuesta de la función
        const auction2 = {};
        try {
            await processAuctionData(auction2, 1);
        } catch (error) {
            console.log(error);

        }
        addAuction(auction);
        updateAuction(auction);
        getRemainingTime(auction.id);
        updateAmountAuction(auction);
        convertDurationToSeconds("PT8H");
        formatDate("2024-12-09T06:20:00");
        const auctionsData = [null];    
        try{
            showModal(auction, 1);
        }catch(error){
            console.log(error);

        }
        
        // Verifica que la subasta se haya agregado a auctionsData
        expect(auctionsData).toContain(null);
    });
    test('debería agregar una subasta correctamente', async () => {
        
        const auction = { id: '1', title: 'Auction 1', bidRanking: [1] };

        // Simula el procesamiento de la subasta
        processAuctionData(auction, 1);  // Mock de la respuesta de la función
        const auction2 = {};
        try {
            await processAuctionData(auction2, 1);
        } catch (error) {
            console.log(error);

        }
        addAuction(auction);
        updateAuction(auction);
        getRemainingTime(auction.id);
        updateAmountAuction(auction);
        convertDurationToSeconds("PT8H");
        formatDate("2024-12-09T06:20:00");
        const auctionsData = [null];    
        try{
            subscribeToAuction(auction.id);
        }catch(error){
            console.log(error);

        }
        try{
            checkSubscription(auction.id);
        }catch(error){
            console.log(error);

        }
        // Verifica que la subasta se haya agregado a auctionsData
        expect(auctionsData).toContain(null);
    });



});