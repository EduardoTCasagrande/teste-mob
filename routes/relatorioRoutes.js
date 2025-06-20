const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');

router.get('/relatorios', relatorioController.page);
router.post('/relatorio', relatorioController.salvar);
router.get('/api/relatorios', relatorioController.listar);
router.get('/api/relatorios/:nomeArquivo', relatorioController.ler);
router.delete('/api/relatorios/:nomeArquivo', relatorioController.deletar);

module.exports = router;
