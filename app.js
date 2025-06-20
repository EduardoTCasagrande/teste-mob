const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Criar diretório de relatórios se não existir
const relatoriosDir = path.join(__dirname, 'relatorios');
if (!fs.existsSync(relatoriosDir)) {
  fs.mkdirSync(relatoriosDir, { recursive: true });
}

// Configurar EJS como view engine e definir a pasta de views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares globais
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Arquivos estáticos: CSS, JS, imagens
app.use(session({
  secret: 'uma-chave-secreta-aqui',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 36000000 }
}));

// Rotas
app.use('/', require('./routes/authRoutes'));
app.use('/', require('./routes/reposicaoRoutes'));
app.use('/', require('./routes/relatorioRoutes'));
app.use('/', require('./routes/vendaRoutes'));
app.use('/', require('./routes/quiosqueRoutes'));
app.use('/', require('./routes/precoRoutes'));
app.use('/', require('./routes/caixaRoutes'));
app.use('/cupons', express.static(path.join(__dirname, 'cupons')));

const estoqueRoutes = require('./routes/estoqueRoutes');
app.use(estoqueRoutes);

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
