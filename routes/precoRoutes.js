const express = require('express');
const router = express.Router();
const path = require('path');
const precoController = require('../controllers/precoController');

// GET para página HTML
router.get('/cadastrar-sku', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'sku.html'));
});

// POST com upload da foto e cadastro
router.post('/cadastrar-sku', precoController.uploadMiddleware, precoController.cadastrarSku);
  
// Outras rotas já existentes
router.get('/api/precos', precoController.listarPrecos);
router.get('/precos', precoController.precosPage);
router.post('/precos', precoController.adicionarPreco);
router.put('/precos/:sku', precoController.atualizarPreco);
router.delete('/precos/:sku', precoController.deletarPreco);

module.exports = router;
