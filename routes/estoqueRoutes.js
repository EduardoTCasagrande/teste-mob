const express = require('express');
const router = express.Router();
const estoqueController = require('../controllers/estoqueController');


router.get('/estoque', estoqueController.estoque)
router.get('/api/estoque', estoqueController.buscarEstoquePorSessao);

module.exports = router;
