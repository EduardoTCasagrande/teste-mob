const express = require('express');
const router = express.Router();
const reposicaoController = require('../controllers/reposicaoController');

router.get('/reposicao', reposicaoController.renderReposicaoPage);
router.post('/reposicao', reposicaoController.salvarReposicao);
router.post('/bipar', reposicaoController.biparSku);

module.exports = router;
