const request = require('supertest');
const app = require('../src/server');
const db = require('../src/database/db');

let adminToken = '';
let abogadoToken = '';
let testCasoId = '';

beforeAll(async () => {
    // Para las pruebas, inicializamos la BD asegurándonos de que esté limpia
    await require('../src/database/init.js');
    
    // Hacemos login para obtener los tokens
    const resAdmin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@cervantes.com', password: 'admin123' });
    adminToken = resAdmin.body.token;

    const resAbogado = await request(app)
        .post('/api/auth/login')
        .send({ email: 'abogado@cervantes.com', password: 'abogado123' });
    abogadoToken = resAbogado.body.token;
});

afterAll((done) => {
    db.close(() => done());
});

describe('API Tests - Cervantes Asociados', () => {
    
    // ----------------------------------------------------
    // AUTH TESTS
    // ----------------------------------------------------
    describe('Autenticación y Seguridad', () => {
        it('1. Debe iniciar sesión exitosamente como Administrador', async () => {
            const res = await request(app).post('/api/auth/login').send({ email: 'admin@cervantes.com', password: 'admin123' });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
        });

        it('2. Debe iniciar sesión exitosamente como Abogado', async () => {
            const res = await request(app).post('/api/auth/login').send({ email: 'abogado@cervantes.com', password: 'abogado123' });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
        });

        it('3. Debe fallar el login con email inválido o no existente', async () => {
            const res = await request(app).post('/api/auth/login').send({ email: 'fake@email.com', password: '123' });
            expect(res.statusCode).toEqual(401);
        });

        it('4. Debe fallar el login con password incorrecto', async () => {
            const res = await request(app).post('/api/auth/login').send({ email: 'admin@cervantes.com', password: 'wrong' });
            expect(res.statusCode).toEqual(401);
        });

        it('5. Debe fallar si no se envían credenciales', async () => {
            const res = await request(app).post('/api/auth/login').send({});
            expect(res.statusCode).toEqual(400);
        });
    });

    // ----------------------------------------------------
    // CASOS TESTS
    // ----------------------------------------------------
    describe('Gestión de Casos', () => {
        it('6. GET /api/casos sin token debe fallar con 401', async () => {
            const res = await request(app).get('/api/casos');
            expect(res.statusCode).toEqual(401);
        });
        
        it('7. GET /api/casos con token debe retornar array de casos', async () => {
            const res = await request(app).get('/api/casos').set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBeTruthy();
        });

        it('8. POST /api/casos debe crear un caso exitosamente con estatus Abierto', async () => {
            const res = await request(app).post('/api/casos').set('Authorization', `Bearer ${adminToken}`).send({
                descripcion: 'Caso Test 1', cliente_id: 1
            });
            expect(res.statusCode).toEqual(201);
            expect(res.body.estatus).toBe('Abierto');
            testCasoId = res.body.id;
        });

        it('9. POST /api/casos sin cliente_id debe fallar 400', async () => {
            const res = await request(app).post('/api/casos').set('Authorization', `Bearer ${adminToken}`).send({
                descripcion: 'Falla test'
            });
            expect(res.statusCode).toEqual(400);
        });

        it('10. GET /api/casos con querystring de búsqueda debe filtrar (éxito)', async () => {
            const res = await request(app).get('/api/casos?busqueda=Test').set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });

        it('11. GET /api/casos con búsqueda sin resultados debe retornar array vacío', async () => {
            const res = await request(app).get('/api/casos?busqueda=INEXISTENTE_XYZ').set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBe(0);
        });

        it('12. POST /api/casos autogenera el folio correctamente (CA-YYYY-XXXX)', async () => {
            const res = await request(app).post('/api/casos').set('Authorization', `Bearer ${adminToken}`).send({ descripcion: 'Test Folio', cliente_id: 1 });
            expect(res.statusCode).toEqual(201);
            expect(res.body.folio).toMatch(/^CA-\d{4}-\d{4}$/);
        });

        it('13. POST /api/casos generando múltiples folios asegura numeración consecutiva', async () => {
            const res1 = await request(app).post('/api/casos').set('Authorization', `Bearer ${adminToken}`).send({ descripcion: 'A', cliente_id: 1 });
            const res2 = await request(app).post('/api/casos').set('Authorization', `Bearer ${adminToken}`).send({ descripcion: 'B', cliente_id: 1 });
            
            const n1 = parseInt(res1.body.folio.split('-')[2]);
            const n2 = parseInt(res2.body.folio.split('-')[2]);
            expect(n2).toEqual(n1 + 1);
        });
    });

    // ----------------------------------------------------
    // VALIDACIÓN DE ESTATUS
    // ----------------------------------------------------
    describe('Validación de Estatus de Casos', () => {
        it('14. PUT /estatus permite cambio a "En Progreso"', async () => {
            const res = await request(app).put(`/api/casos/${testCasoId}/estatus`).set('Authorization', `Bearer ${adminToken}`).send({ estatus: 'En Progreso' });
            expect(res.statusCode).toEqual(200);
            expect(res.body.estatus).toBe('En Progreso');
        });

        it('15. PUT /estatus permite cambio a "Pausado"', async () => {
            const res = await request(app).put(`/api/casos/${testCasoId}/estatus`).set('Authorization', `Bearer ${adminToken}`).send({ estatus: 'Pausado' });
            expect(res.statusCode).toEqual(200);
            expect(res.body.estatus).toBe('Pausado');
        });

        it('16. PUT /estatus inválido retorna 400 (ej. Terminado)', async () => {
            const res = await request(app).put(`/api/casos/${testCasoId}/estatus`).set('Authorization', `Bearer ${adminToken}`).send({ estatus: 'Terminado' });
            expect(res.statusCode).toEqual(400);
        });

        it('17. PUT /estatus de un id de caso inexistente retorna 404', async () => {
            const res = await request(app).put(`/api/casos/99999/estatus`).set('Authorization', `Bearer ${adminToken}`).send({ estatus: 'Pausado' });
            expect(res.statusCode).toEqual(404);
        });
    });

    // ----------------------------------------------------
    // CLIENTES Y ROLES (Para completar 20 casos de prueba)
    // ----------------------------------------------------
    describe('Clientes y Control de Roles (RBAC)', () => {
        it('18. GET /api/clientes con token retorna 200 (Acceso de lectura a todos)', async () => {
            const res = await request(app).get('/api/clientes').set('Authorization', `Bearer ${abogadoToken}`);
            expect(res.statusCode).toEqual(200);
        });

        it('19. POST /api/clientes con Admin retorna 201 (Acceso de escritura permitido)', async () => {
            const res = await request(app).post('/api/clientes').set('Authorization', `Bearer ${adminToken}`).send({
                nombre: 'Nuevo Cliente'
            });
            expect(res.statusCode).toEqual(201);
        });

        it('20. POST /api/clientes con Abogado retorna 403 (Acceso de escritura denegado)', async () => {
            const res = await request(app).post('/api/clientes').set('Authorization', `Bearer ${abogadoToken}`).send({
                nombre: 'Cliente Ilegal'
            });
            expect(res.statusCode).toEqual(403);
        });
    });
});
