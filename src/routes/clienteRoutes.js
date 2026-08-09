const express = require('express');
const router = express.Router();
const { getClientes, createCliente, updateCliente, deleteCliente } = require('../controllers/clienteController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// GET accesible para todos (autenticados)
router.get('/', getClientes);

// POST, PUT, DELETE solo para Administradores
router.post('/', requireRole('Administrador'), createCliente);
router.put('/:id', requireRole('Administrador'), updateCliente);
router.delete('/:id', requireRole('Administrador'), deleteCliente);

module.exports = router;
