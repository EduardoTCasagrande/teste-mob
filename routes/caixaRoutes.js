// routes/caixa.js
const express = require('express');
const router = express.Router();
const caixaController = require('../controllers/caixaController');

router.get('/api/caixa/:quiosque', caixaController.getCaixaTotal);
router.get('/api/caixa/historico/:quiosque', caixaController.getHistoricoCaixa);
router.post('/api/sangria', caixaController.registrarSangria);

module.exports = router;
