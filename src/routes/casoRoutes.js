const express = require('express');
const router = express.Router();
const { getCasos, createCaso, updateEstatusCaso, updateCaso, deleteCaso } = require('../controllers/casoController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getCasos);
router.post('/', createCaso);
router.put('/:id', updateCaso);
router.delete('/:id', deleteCaso);
router.put('/:id/estatus', updateEstatusCaso);

module.exports = router;
