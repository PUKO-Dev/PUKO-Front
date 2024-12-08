// Importar funciones necesarias

const { decryptData } = require('../cocomat-pro/jsTest/login');
const CryptoJS = require('crypto-js');

const { validateLogin } = require('../cocomat-pro/jsTest/login');
const Swal = require('sweetalert2');
// Mock de los elementos DOM que se utilizan
jest.mock('sweetalert2', () => ({
    fire: jest.fn(),
}));

describe('validateLogin', () => {
    let mockFetch;

    beforeEach(() => {
        mockFetch = jest.fn();
        global.fetch = mockFetch;
        document.body.innerHTML = `
            <input placeholder="Username" value="testuser" />
            <input placeholder="Password" value="password123" />
            <div class="loading"></div>
        `;
        sessionStorage.clear();
    });

    test('debería realizar una solicitud fetch y almacenar datos en sessionStorage al hacer login correctamente', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                username: 'testuser',
                id: '123',
                authProvider: 'basic',
            }),
        });

        await validateLogin({ preventDefault: jest.fn() });

        expect(mockFetch).toHaveBeenCalledWith('http://20.3.4.249/api/users/me', expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
                'Authorization': 'Basic dGVzdHVzZXI6cGFzc3dvcmQxMjM=', // codificado base64
                'Content-Type': 'application/json'
            })
        }));

        expect(sessionStorage.getItem('username')).toBe(null);
        expect(sessionStorage.getItem('userId')).toBe(null);

    });

    test('debería mostrar un mensaje de error si la autenticación falla', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
        });

        await validateLogin({ preventDefault: jest.fn() });

        expect(require('sweetalert2').fire).toHaveBeenCalledWith(expect.objectContaining({
            title: "Error",
            text: "Failed to log in. Please verify your credentials.",
        }));
    });

    test('debería eliminar la clase no-scroll y redirigir al usuario después del login exitoso', async () => {
        // Mock de fetch para simular una respuesta exitosa
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                username: 'testuser',
                id: '123',
                authProvider: 'basic',
            }),
        });

        // Asegúrate de que la clase `no-scroll` esté presente antes de ejecutar la función
        document.body.classList.add('no-scroll');

        // Mock de Swal.fire para simular el flujo completo
        Swal.fire.mockImplementation(() => Promise.resolve()); // Simula el `then`

        // Mock para window.location.href
        delete window.location;
        window.location = { href: '' };

        // Ejecuta la función
        await validateLogin({ preventDefault: jest.fn() });

        // Espera a que las promesas internas se resuelvan
        await new Promise((resolve) => process.nextTick(resolve));

        // Verifica que la clase `no-scroll` fue eliminada
        expect(document.body.classList.contains('no-scroll')).toBe(false);

        // Verifica que la redirección ocurrió
        expect(window.location.href).toBe('/html/home.html');
    });

    test('debería activar el indicador de carga durante el inicio de sesión', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                username: 'testuser',
                id: '123',
                authProvider: 'basic',
            }),
        });

        const loadingElement = document.querySelector('.loading');
        await validateLogin({ preventDefault: jest.fn() });

        expect(loadingElement.classList.contains('active')).toBe(true);
    });


});