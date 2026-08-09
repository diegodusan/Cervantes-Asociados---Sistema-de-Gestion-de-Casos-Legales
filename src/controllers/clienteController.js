const db = require('../database/db');

// GET /api/clientes (Protegido por verifyToken en la ruta)
const getClientes = (req, res) => {
    db.all(`SELECT * FROM clientes`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// POST /api/clientes (Solo Admin)
const createCliente = (req, res) => {
    const { nombre, telefono, email } = req.body;
    if (!nombre) return res.status(400).json({ message: 'Nombre es requerido' });

    db.run(`INSERT INTO clientes (nombre, telefono, email) VALUES (?, ?, ?)`, 
        [nombre, telefono, email], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, nombre, telefono, email });
        }
    );
};

// PUT /api/clientes/:id (Solo Admin)
const updateCliente = (req, res) => {
    const { id } = req.params;
    const { nombre, telefono, email } = req.body;
    if (!nombre) return res.status(400).json({ message: 'Nombre es requerido' });

    db.run(`UPDATE clientes SET nombre = ?, telefono = ?, email = ? WHERE id = ?`,
        [nombre, telefono, email, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
            res.json({ id, nombre, telefono, email });
        }
    );
};

// DELETE /api/clientes/:id (Solo Admin)
const deleteCliente = (req, res) => {
    const { id } = req.params;

    db.run(`DELETE FROM clientes WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
        res.json({ message: 'Cliente eliminado correctamente' });
    });
};

module.exports = { getClientes, createCliente, updateCliente, deleteCliente };
