const express = require('express');
const router = express.Router();
const quiosqueController = require('../controllers/quiosqueController');

router.get('/quiosque', quiosqueController.page);
router.get('/quiosques', quiosqueController.listar);
router.post('/add', quiosqueController.adicionar);

router.get('/quiosque-info/:nome', (req, res) => {
  const nome = req.params.nome;
  const db = require('../models/db');
  db.get('SELECT range, colunas FROM quiosques WHERE nome = ?', [nome], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Quiosque não encontrado' });
    res.json(row);
  });
});

module.exports = router;
