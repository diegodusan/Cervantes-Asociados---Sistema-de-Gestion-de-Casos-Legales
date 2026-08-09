const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const initDB = async () => {
    try {
        const saltRounds = 12; // Rúbrica exige costo 12
        const adminHash = await bcrypt.hash('admin123', saltRounds);
        const abogadoHash = await bcrypt.hash('abogado123', saltRounds);

        db.serialize(() => {
            // Habilitar foreign keys
            db.run('PRAGMA foreign_keys = ON');

            // Tabla usuarios
            db.run(`
                CREATE TABLE IF NOT EXISTS usuarios (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    rol TEXT CHECK(rol IN ('Administrador', 'Abogado')) NOT NULL
                )
            `);

            // Tabla clientes
            db.run(`
                CREATE TABLE IF NOT EXISTS clientes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT NOT NULL,
                    telefono TEXT,
                    email TEXT
                )
            `);

            // Tabla casos
            db.run(`
                CREATE TABLE IF NOT EXISTS casos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    folio TEXT UNIQUE NOT NULL,
                    descripcion TEXT,
                    estatus TEXT CHECK(estatus IN ('Abierto', 'En Progreso', 'Pausado', 'Cerrado')) DEFAULT 'Abierto',
                    cliente_id INTEGER,
                    abogado_id INTEGER,
                    fechas TEXT,
                    FOREIGN KEY (cliente_id) REFERENCES clientes (id),
                    FOREIGN KEY (abogado_id) REFERENCES usuarios (id)
                )
            `);

            // Limpiar datos anteriores para asegurar estado limpio en cada inicialización
            db.run(`DELETE FROM casos`);
            db.run(`DELETE FROM clientes`);
            db.run(`DELETE FROM usuarios`);

            // Poblar datos de prueba
            db.run(`INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)`, 
                ['Admin Principal', 'admin@cervantes.com', adminHash, 'Administrador']);
            db.run(`INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)`, 
                ['Abogado Uno', 'abogado@cervantes.com', abogadoHash, 'Abogado']);

            db.run(`INSERT INTO clientes (nombre, telefono, email) VALUES (?, ?, ?)`,
                ['Juan Pérez', '555-1234', 'juan@ejemplo.com']);
            
            db.run(`INSERT INTO casos (folio, descripcion, estatus, cliente_id, abogado_id, fechas) VALUES (?, ?, ?, ?, ?, ?)`,
                ['CA-2026-0001', 'Demanda por despido injustificado', 'Abierto', 1, 2, new Date().toISOString()]);

            console.log('Base de datos inicializada y poblada con éxito.');
        });
    } catch (err) {
        console.error('Error preparando los datos iniciales:', err);
    }
};

initDB().then(() => {
    // db.close() se llamaría al terminar el serialize internamente, pero aquí está bien
    // Dejar un timeout asegura que la db.close() se ejecute después del queue de serialize.
    setTimeout(() => {
        db.close();
    }, 1000);
});
