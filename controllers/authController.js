const bcrypt = require('bcrypt');
const path = require('path');
const db = require('../models/db');

exports.loginPage = (req, res) => {
  res.render('login')
};

exports.dashboard = (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('dashboard');
};

exports.registroPage = (req, res) => {
  res.render('registro')
};

exports.registro = async (req, res) => {
  const { username, senha, quiosque } = req.body;

  if (!username || !senha || !quiosque) {
    return res.status(400).json({ status: 'erro', mensagem: 'Todos os campos são obrigatórios.' });
  }

  try {
    const hash = await bcrypt.hash(senha, 10);

    db.run(`INSERT INTO usuarios (username, senha, quiosque) VALUES (?, ?, ?)`,
      [username, hash, quiosque],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) {
            return res.status(400).json({ status: 'erro', mensagem: 'Usuário já existe.' });
          }
          console.error("Erro ao registrar usuário:", err.message);
          return res.status(500).json({ status: 'erro', mensagem: 'Erro interno ao registrar.' });
        }
        res.json({ status: 'ok', mensagem: 'Usuário registrado com sucesso!' });
      });

  } catch (err) {
    res.status(500).json({ status: 'erro', mensagem: 'Erro ao processar senha.' });
  }
};

exports.login = (req, res) => {
  const { username, senha } = req.body;

  db.get('SELECT * FROM usuarios WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ status: 'erro', mensagem: 'Erro ao buscar usuário' });

    if (!user) return res.status(401).json({ status: 'erro', mensagem: 'Usuário ou senha inválidos' });

    const senhaOk = await bcrypt.compare(senha, user.senha);
    if (!senhaOk) {
      return res.status(401).json({ status: 'erro', mensagem: 'Usuário ou senha inválidos' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      quiosque: user.quiosque
    };

    res.json({ status: 'ok', mensagem: 'Login bem-sucedido' });
  });
};

exports.sessionUser = (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ erro: 'Sessão expirada' });
  }
  res.json({ quiosque: req.session.user.quiosque });
};

exports.meuQuiosque = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ erro: 'Não autenticado' });
  }
  res.json({ quiosque: req.session.user.quiosque });
};
