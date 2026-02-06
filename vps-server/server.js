/**
 * Servidor Unificado - Frontend + Backend
 * 
 * Roda o painel completo (React buildado + API) em um único processo Node.js
 * 
 * Instalação na VPS:
 * 1. npm install express cors compression
 * 2. Copie a pasta 'dist' (build do React) para ./dist
 * 3. node server.js
 * 
 * Com PM2:
 * pm2 start server.js --name "hytale-panel"
 */

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3007;

// Configurações do servidor Hytale
const CONFIG = {
  serviceName: process.env.SERVICE_NAME || 'hytale.service',
  serverDir: process.env.SERVER_DIR || '/opt/hytale',
};

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = req.query.path || '';
    uploadPath = uploadPath.replace(/^\/+/, '');
    const safePath = path.resolve(CONFIG.serverDir, uploadPath);
    
    // Verifica se está dentro do diretório permitido
    if (!safePath.startsWith(CONFIG.serverDir)) {
      return cb(new Error('Acesso negado'), null);
    }
    
    // Cria o diretório se não existir
    if (!fs.existsSync(safePath)) {
      fs.mkdirSync(safePath, { recursive: true });
    }
    
    cb(null, safePath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Middlewares
app.use(cors());
app.use(compression());
app.use(express.json());

// Utilitário para executar comandos
const runCommand = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
};

// ============================================
// API ENDPOINTS
// ============================================

// GET /api/stats - Estatísticas do sistema
app.get('/api/stats', async (req, res) => {
  try {
    const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = (usedMem / totalMem) * 100;

    let diskUsage = 0;
    try {
      const diskInfo = await runCommand("df -h / | awk 'NR==2 {print $5}' | tr -d '%'");
      diskUsage = parseFloat(diskInfo) || 0;
    } catch (e) {
      console.error('Erro ao obter uso de disco:', e);
    }

    let serverStatus = 'offline';
    try {
      const status = await runCommand(`systemctl is-active ${CONFIG.serviceName}`);
      serverStatus = status === 'active' ? 'online' : 'offline';
    } catch (e) {
      serverStatus = 'offline';
    }

    const uptimeSeconds = os.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    res.json({
      cpu: Math.round(cpuUsage * 10) / 10,
      ram: Math.round(memUsage * 10) / 10,
      disk: diskUsage,
      serverStatus,
      uptime: `${hours}h ${minutes}m`,
      totalRam: Math.round(totalMem / (1024 * 1024 * 1024) * 10) / 10,
      usedRam: Math.round(usedMem / (1024 * 1024 * 1024) * 10) / 10,
    });
  } catch (error) {
    console.error('Erro em /api/stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/players - Lista de jogadores
app.get('/api/players', (req, res) => {
  try {
    const data = fs.readFileSync('/opt/hytale/players.json', 'utf8');
    const players = JSON.parse(data);

    const formatted = Object.values(players).map(p => ({
      id: p.name,
      name: p.name,
      role: "Player",
      avatar: `https://mc-heads.net/avatar/${p.name}`, 
      joinedAt: new Date(p.joinedAt).toLocaleTimeString(),
      ping: Math.floor(Math.random() * 80) + 30,
      afk: Date.now() - p.lastSeen > 60000
    }));

    res.json({
      online: formatted.length,
      max: 50,
      players: formatted
    });
  } catch {
    res.json({ online: 0, max: 50, players: [] });
  }
});

// POST /api/server/:action - Controle do servidor
app.post('/api/server/:action', async (req, res) => {
  const { action } = req.params;
  
  if (!['start', 'stop', 'restart'].includes(action)) {
    return res.status(400).json({ error: 'Ação inválida' });
  }

  try {
    await runCommand(`sudo systemctl ${action} ${CONFIG.serviceName}`);
    res.json({ success: true, message: `Servidor ${action === 'start' ? 'iniciado' : action === 'stop' ? 'parado' : 'reiniciado'}` });
  } catch (error) {
    console.error(`Erro ao ${action} servidor:`, error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/logs - Logs do servidor
app.get('/api/logs', async (req, res) => {
  try {
    const lines = req.query.lines || 100;
    const logs = await runCommand(`sudo journalctl -u ${CONFIG.serviceName} -n ${lines} --no-pager`);
    res.json({ logs: logs.split('\n') });
  } catch (error) {
    console.error('Erro em /api/logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/files - Lista arquivos
app.get('/api/files', async (req, res) => {
  try {
    let requestedPath = req.query.path || '';
    // remove / inicial para evitar path absoluto
    requestedPath = requestedPath.replace(/^\/+/, '');
    const safePath = path.resolve(CONFIG.serverDir, requestedPath);
    
    if (!safePath.startsWith(CONFIG.serverDir)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'Diretório não encontrado' });
    }

    const items = fs.readdirSync(safePath, { withFileTypes: true });
    const files = items.map(item => ({
      name: item.name,
      type: item.isDirectory() ? 'folder' : 'file',
      path: path.relative(CONFIG.serverDir, path.join(safePath, item.name)),
      size: item.isFile() ? fs.statSync(path.join(safePath, item.name)).size : null,
    }));

    res.json({ 
      path: path.relative(CONFIG.serverDir, safePath) || '/',
      files 
    });
  } catch (error) {
    console.error('Erro em /api/files:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/upload - Upload de arquivo
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    res.json({ 
      success: true, 
      message: `Arquivo ${req.file.originalname} enviado com sucesso`,
      file: {
        name: req.file.originalname,
        size: req.file.size,
        path: '/' + (req.query.path || '')
      }
    });
  } catch (error) {
    console.error('Erro em /api/upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/files/:path - Deletar arquivo
app.delete('/api/files/:filePath(*)', (req, res) => {
  try {
    let filePath = req.params.filePath;
    filePath = filePath.replace(/^\/+/, '');
    const safePath = path.resolve(CONFIG.serverDir, filePath);
    
    // Verifica se está dentro do diretório permitido
    if (!safePath.startsWith(CONFIG.serverDir)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    const stat = fs.statSync(safePath);
    if (stat.isDirectory()) {
      fs.rmdirSync(safePath, { recursive: true });
    } else {
      fs.unlinkSync(safePath);
    }
    
    res.json({ success: true, message: 'Arquivo deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// FRONTEND ESTÁTICO
// ============================================

// Serve arquivos estáticos do build React
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback - todas as rotas vão para index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ============================================
// INICIALIZAÇÃO
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🎮 ═══════════════════════════════════════════════════════');
  console.log('   HYTALE PANEL - Servidor Unificado');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   🌐 Acesse: http://localhost:${PORT}`);
  console.log(`   📁 Servindo frontend de: ${distPath}`);
  console.log(`   🎯 Controlando: ${CONFIG.serviceName}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('   API Endpoints:');
  console.log('   ├── GET  /api/stats');
  console.log('   ├── GET  /api/players');
  console.log('   ├── GET  /api/logs');
  console.log('   ├── GET  /api/files');
  console.log('   ├── POST /api/server/start');
  console.log('   ├── POST /api/server/stop');
  console.log('   └── POST /api/server/restart');
  console.log('');
});
