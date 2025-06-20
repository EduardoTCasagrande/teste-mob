const express = require('express');
const path = require('path'); 
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/', authController.loginPage);
router.post('/login', authController.login);
router.get('/registro', authController.registroPage);
router.post('/registro', authController.registro);
router.get('/dashboard', authController.dashboard);
router.get('/session-user', authController.sessionUser);
router.get('/meu-quiosque', authController.meuQuiosque);
router.get('/sangria', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.sendFile(path.join(__dirname, '../public', 'sangria.html'));
});

module.exports = router;
