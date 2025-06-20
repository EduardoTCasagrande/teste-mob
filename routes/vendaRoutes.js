const express = require('express');
const router = express.Router();
const vendaController = require('../controllers/vendaController');

router.get('/vendas', vendaController.vendasPage);
router.post('/vender', vendaController.vender);
router.get('/historico-vendas', vendaController.historico);

module.exports = router;
