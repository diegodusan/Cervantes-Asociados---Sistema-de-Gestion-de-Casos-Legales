const db = require('../database/db');

// Autogenerar folio CA-YYYY-XXXX
const generarFolio = () => {
    return new Promise((resolve, reject) => {
        const year = new Date().getFullYear();
        const prefix = `CA-${year}-`;
        
        db.get(`SELECT folio FROM casos WHERE folio LIKE ? ORDER BY folio DESC LIMIT 1`, [`${prefix}%`], (err, row) => {
            if (err) return reject(err);
            
            let nextNumber = 1;
            if (row) {
                const parts = row.folio.split('-');
                if (parts.length === 3) {
                    nextNumber = parseInt(parts[2], 10) + 1;
                }
            }
            
            const folioNumber = nextNumber.toString().padStart(4, '0');
            resolve(`${prefix}${folioNumber}`);
        });
    });
};

// GET /api/casos?busqueda=X
const getCasos = (req, res) => {
    const { busqueda } = req.query;
    
    let query = `
        SELECT c.*, cli.nombre as cliente_nombre 
        FROM casos c 
        LEFT JOIN clientes cli ON c.cliente_id = cli.id
    `;
    let params = [];

    if (busqueda) {
        query += ` WHERE c.folio LIKE ? OR cli.nombre LIKE ?`;
        // Seguridad: Consultas parametrizadas evitan Inyección SQL
        params.push(`%${busqueda}%`, `%${busqueda}%`);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// POST /api/casos
const createCaso = async (req, res) => {
    const { descripcion, cliente_id, abogado_id } = req.body;
    
    if (!cliente_id) {
        return res.status(400).json({ message: 'El cliente_id es requerido' });
    }

    try {
        const folio = await generarFolio();
        const fechas = new Date().toISOString();
        
        db.run(`INSERT INTO casos (folio, descripcion, estatus, cliente_id, abogado_id, fechas) VALUES (?, ?, ?, ?, ?, ?)`,
            [folio, descripcion, 'Abierto', cliente_id, abogado_id || req.user.id, fechas],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ id: this.lastID, folio, descripcion, estatus: 'Abierto', cliente_id });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'Error generando folio' });
    }
};

// PUT /api/casos/:id/estatus
const updateEstatusCaso = (req, res) => {
    const { id } = req.params;
    const { estatus } = req.body;
    
    const validEstatus = ['Abierto', 'En Progreso', 'Pausado', 'Cerrado'];
    if (!validEstatus.includes(estatus)) {
        return res.status(400).json({ message: 'Estatus no válido. Debe ser uno de: ' + validEstatus.join(', ') });
    }

    db.run(`UPDATE casos SET estatus = ? WHERE id = ?`, [estatus, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Caso no encontrado' });
        res.json({ message: 'Estatus actualizado correctamente', id, estatus });
    });
};

// PUT /api/casos/:id
const updateCaso = (req, res) => {
    const { id } = req.params;
    const { descripcion, estatus, cliente_id } = req.body;
    
    const validEstatus = ['Abierto', 'En Progreso', 'Pausado', 'Cerrado'];
    if (estatus && !validEstatus.includes(estatus)) {
        return res.status(400).json({ message: 'Estatus no válido. Debe ser uno de: ' + validEstatus.join(', ') });
    }

    let query = `UPDATE casos SET descripcion = ?, cliente_id = ?`;
    let params = [descripcion, cliente_id];

    if (estatus) {
        query += `, estatus = ?`;
        params.push(estatus);
    }
    
    query += ` WHERE id = ?`;
    params.push(id);

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Caso no encontrado' });
        res.json({ message: 'Caso actualizado correctamente', id });
    });
};

// DELETE /api/casos/:id
const deleteCaso = (req, res) => {
    const { id } = req.params;

    db.run(`DELETE FROM casos WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Caso no encontrado' });
        res.json({ message: 'Caso eliminado correctamente' });
    });
};

module.exports = { getCasos, createCaso, updateEstatusCaso, updateCaso, deleteCaso };
