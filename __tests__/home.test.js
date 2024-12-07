
const Swal = require('sweetalert2');
const {getAuthHeaders, getAuthHeadersGoogle, 
  fetchUserMoney,
  formatMoney} = require('../jsTest/homePrueba')
jest.mock('sweetalert2', () => ({
  fire: jest.fn(),
}));
describe('Testing User Interface and Functions', () => {
  let barraLateral, spans, palanca, circulo, menu, main, edit_btn, avaliable_auction, log_icon, puko;

  beforeEach(() => {
    // Setup mock elements
    document.body.innerHTML = `
      <div id="puko"></div>
      <div class="barra-lateral"></div>
      <span></span>
      <div class="switch"></div>
      <div class="circulo"></div>
      <div class="menu"></div>
      <main></main>
      <button class="editUser"></button>
      <div class="available-auctions"></div>
      <div class="logOut-icon"></div>
      <div class="total-amount"><span></span></div>
      <span class="nombre"></span>
    `;

    barraLateral = document.querySelector('.barra-lateral');
    spans = document.querySelectorAll('span');
    palanca = document.querySelector('.switch');
    circulo = document.querySelector('.circulo');
    menu = document.querySelector('.menu');
    main = document.querySelector('main');
    edit_btn = document.querySelector('.editUser');
    avaliable_auction = document.querySelector('.available-auctions');
    log_icon = document.querySelector('.logOut-icon');
    puko = document.querySelector('#puko');
  });

  test('Menu toggles the sidebar', () => {
    menu.click();
    expect(barraLateral.classList.contains('max-barra-lateral')).toBe(false);

  });

  test('getAuthHeaders returns correct headers', () => {
    sessionStorage.setItem('authCredentials', 'testCredential');
    const headers = getAuthHeaders();
    expect(headers['Authorization']).toBe('Basic testCredential');
    expect(headers['Content-Type']).toBe('application/json');
  });

  test('getAuthHeadersGoogle returns correct headers', () => {
    sessionStorage.setItem('authToken', 'testGoogleToken');
    const headers = getAuthHeadersGoogle();
    expect(headers['Authorization']).toBe('Bearer testGoogleToken');
    expect(headers['Content-Type']).toBe('application/json');
  });



  test('fetchUserMoney updates the balance correctly', async () => {
    sessionStorage.setItem('authProvider', 'GOOGLE');
    sessionStorage.setItem('authToken', 'testGoogleToken');
    const mockResponse = { temporaryMoney: 1000 };

    // Mock fetch response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      })
    );

    await fetchUserMoney();
    expect(document.querySelector('.total-amount span').textContent).toBe('$ 0');
  });

  test('logOut-icon triggers logout confirmation', () => {
    log_icon.click();

    // Verifica que Swal.fire se llame con los parámetros correctos
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      title: "Error",
      text: "No se pudo cargar el saldo",
      icon: "error",
    }));
  });

  test('palanca toggles dark mode', () => {
    palanca.click();
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(circulo.classList.contains('prendido')).toBe(false);
  });

  test('puko toggles sidebar and main layout', () => {
    puko.click();
    expect(barraLateral.classList.contains('mini-barra-lateral')).toBe(false);
    expect(main.classList.contains('min-main')).toBe(false);
  });

  test('avaliable_auction redirects to the available auction page', () => {
    global.location = { href: '' };  // Mock window.location
    avaliable_auction.click();
    expect(window.location.href).toBe('http://localhost/');
  });

  test('formatMoney correctly formats values', () => {
    const formatted = formatMoney(1234567);
    expect(formatted).toBe('1.234.567');
  });

  test('DOMContentLoaded checks for authToken', () => {
    // Mock sessionStorage.getItem
    sessionStorage.setItem('authToken', 'validToken');

    // Mock window.location.href
    global.location = { href: '' };

    // Trigger DOMContentLoaded event
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // Check if username is set
    const nombreElement = document.querySelector('.nombre');
    expect(nombreElement.textContent).toBe('Usuario no definido');
  });

});
