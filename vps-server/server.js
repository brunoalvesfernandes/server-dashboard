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
    const lines = Number(req.query.lines || 100);
    const logFile = path.join(CONFIG.serverDir, 'console.log');

    if (fs.existsSync(logFile)) {
      const out = await runCommand(`tail -n ${lines} ${escapeShellArg(logFile)}`);
      return res.json({ logs: out.split('\n') });
    }

    // fallback: se não existir arquivo, tenta journalctl
    const logs = await runCommand(`sudo journalctl -u ${CONFIG.serviceName} -n ${lines} --no-pager`);
    res.json({ logs: logs.split('\n') });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/command - Executar comando no servidor
app.post('/api/command', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Comando inválido' });
    }
    
    // Executa o comando via screen ou diretamente no serviço
    // Adapte conforme sua configuração (screen, tmux, rcon, etc)
    const result = await runCommand(`echo "${command}" | sudo tee -a /opt/hytale/commands.log`);
    
    res.json({ 
      success: true, 
      message: `Comando "${command}" enviado`,
      result 
    });
  } catch (error) {
    console.error('Erro ao executar comando:', error);
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

// ============================================
// CONFIG ENDPOINTS
// ============================================

const CONFIG_FILE = path.join(CONFIG.serverDir, 'panel-config.json');

// GET /api/config - Obter configurações
app.get('/api/config', (req, res) => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return res.json(config);
    }
    // Configuração padrão
    res.json({
      serverName: 'Hytale Brasil',
      serverIp: '168.75.85.54',
      serverPort: '25565',
      maxPlayers: '50',
      motd: 'Bem-vindo ao servidor Hytale!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/config - Salvar configurações
app.post('/api/config', (req, res) => {
  try {
    const config = req.body;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    res.json({ success: true, message: 'Configurações salvas com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/change-password - Alterar senha
app.post('/api/change-password', (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const passwordFile = path.join(CONFIG.serverDir, 'panel-password.json');
    
    let storedPassword = 'Brunoalves1*'; // Senha padrão
    if (fs.existsSync(passwordFile)) {
      const data = JSON.parse(fs.readFileSync(passwordFile, 'utf8'));
      storedPassword = data.password;
    }
    
    if (currentPassword !== storedPassword) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }
    
    fs.writeFileSync(passwordFile, JSON.stringify({ password: newPassword }, null, 2));
    res.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// BACKUP ENDPOINTS
// ============================================

const BACKUP_DIR = path.join(CONFIG.serverDir, 'backups');

// GET /api/backups - Listar backups
app.get('/api/backups', (req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(f => f.endsWith('.tar.gz') || f.endsWith('.zip'))
      .map(f => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        return {
          name: f,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
          path: path.join(BACKUP_DIR, f)
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ backups });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/backups - Criar backup
app.post('/api/backups', async (req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}.tar.gz`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    // Cria backup compactado (excluindo a pasta backups)
    await runCommand(`cd ${CONFIG.serverDir} && tar --exclude='backups' -czf ${backupPath} .`);
    
    const stat = fs.statSync(backupPath);
    res.json({ 
      success: true, 
      message: `Backup ${backupName} criado com sucesso`,
      backup: {
        name: backupName,
        size: stat.size,
        createdAt: stat.birthtime.toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/backups/:name - Deletar backup
app.delete('/api/backups/:name', (req, res) => {
  try {
    const backupPath = path.join(BACKUP_DIR, req.params.name);
    
    if (!backupPath.startsWith(BACKUP_DIR)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }
    
    fs.unlinkSync(backupPath);
    res.json({ success: true, message: 'Backup deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/backups/:name/restore - Restaurar backup
app.post('/api/backups/:name/restore', async (req, res) => {
  try {
    const backupPath = path.join(BACKUP_DIR, req.params.name);
    
    if (!backupPath.startsWith(BACKUP_DIR)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }
    
    // Para o servidor antes de restaurar
    try {
      await runCommand(`sudo systemctl stop ${CONFIG.serviceName}`);
    } catch (e) {
      console.log('Servidor já estava parado ou erro ao parar:', e.message);
    }
    
    // Restaura o backup
    await runCommand(`cd ${CONFIG.serverDir} && tar -xzf ${backupPath} --overwrite`);
    
    // Reinicia o servidor
    await runCommand(`sudo systemctl start ${CONFIG.serviceName}`);
    
    res.json({ success: true, message: 'Backup restaurado com sucesso. Servidor reiniciado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PLUGINS ENDPOINTS
// ============================================

// GET /api/plugins - Listar plugins/mods
app.get('/api/plugins', (req, res) => {
  try {
    const plugins = [];
    
    // Verifica pasta mods
    const modsDir = path.join(CONFIG.serverDir, 'mods');
    if (fs.existsSync(modsDir)) {
      const files = fs.readdirSync(modsDir);
      files.filter(f => f.endsWith('.jar')).forEach(f => {
        const stat = fs.statSync(path.join(modsDir, f));
        const name = f.replace('.jar', '').replace(/-\d+\.\d+.*$/, '');
        const versionMatch = f.match(/-(\d+\.\d+[.\d]*)/);
        plugins.push({
          name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
          version: versionMatch ? versionMatch[1] : '',
          enabled: true,
          description: `Mod instalado na pasta mods/`,
          file: f,
          size: stat.size
        });
      });
    }
    
    // Verifica pasta plugins
    const pluginsDir = path.join(CONFIG.serverDir, 'plugins');
    if (fs.existsSync(pluginsDir)) {
      const files = fs.readdirSync(pluginsDir);
      files.filter(f => f.endsWith('.jar')).forEach(f => {
        const stat = fs.statSync(path.join(pluginsDir, f));
        const name = f.replace('.jar', '').replace(/-\d+\.\d+.*$/, '');
        const versionMatch = f.match(/-(\d+\.\d+[.\d]*)/);
        plugins.push({
          name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
          version: versionMatch ? versionMatch[1] : '',
          enabled: true,
          description: `Plugin instalado na pasta plugins/`,
          file: f,
          size: stat.size
        });
      });
    }
    
    // Verifica pasta mods desativados
    const disabledModsDir = path.join(CONFIG.serverDir, 'mods-disabled');
    if (fs.existsSync(disabledModsDir)) {
      const files = fs.readdirSync(disabledModsDir);
      files.filter(f => f.endsWith('.jar')).forEach(f => {
        const stat = fs.statSync(path.join(disabledModsDir, f));
        const name = f.replace('.jar', '').replace(/-\d+\.\d+.*$/, '');
        const versionMatch = f.match(/-(\d+\.\d+[.\d]*)/);
        plugins.push({
          name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
          version: versionMatch ? versionMatch[1] : '',
          enabled: false,
          description: `Mod desativado`,
          file: f,
          size: stat.size
        });
      });
    }
    
    res.json({ plugins });
  } catch (error) {
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
