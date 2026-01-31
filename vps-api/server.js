/**
 * API Server para VPS - Coloque este arquivo na sua VPS
 * 
 * Instalação:
 * 1. npm init -y
 * 2. npm install express cors
 * 3. node server.js
 * 
 * Ou use PM2 para manter rodando:
 * npm install -g pm2
 * pm2 start server.js --name "hytale-api"
 */

const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3007;

// Configurações do servidor Hytale
const CONFIG = {
  serviceName: 'hytale.service',
  serverDir: '/opt/hytale',
  logsDir: '/opt/hytale/logs',
};

app.use(cors());
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

// GET /api/stats - Retorna estatísticas do sistema
app.get('/api/stats', async (req, res) => {
  try {
    // CPU Usage
    const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
    
    // Memory Usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = (usedMem / totalMem) * 100;

    // Disk Usage
    let diskUsage = 0;
    try {
      const diskInfo = await runCommand("df -h / | awk 'NR==2 {print $5}' | tr -d '%'");
      diskUsage = parseFloat(diskInfo) || 0;
    } catch (e) {
      console.error('Erro ao obter uso de disco:', e);
    }

    // Server Status
    let serverStatus = 'offline';
    try {
      const status = await runCommand(`systemctl is-active ${CONFIG.serviceName}`);
      serverStatus = status === 'active' ? 'online' : 'offline';
    } catch (e) {
      serverStatus = 'offline';
    }

    // Uptime
    const uptimeSeconds = os.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    res.json({
      cpu: Math.round(cpuUsage * 10) / 10,
      ram: Math.round(memUsage * 10) / 10,
      disk: diskUsage,
      serverStatus,
      uptime: `${hours}h ${minutes}m`,
      totalRam: Math.round(totalMem / (1024 * 1024 * 1024) * 10) / 10, // GB
      usedRam: Math.round(usedMem / (1024 * 1024 * 1024) * 10) / 10, // GB
    });
  } catch (error) {
    console.error('Erro em /api/stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/players - Lista jogadores online (placeholder - adapte para seu servidor)
app.get('/api/players', async (req, res) => {
  try {
    // TODO: Integrar com RCON ou query do servidor Hytale
    // Por enquanto retorna lista vazia ou mockada
    
    // Exemplo de como seria com RCON:
    // const rcon = new Rcon({ host: 'localhost', port: 25575, password: 'senha' });
    // const players = await rcon.send('list');
    
    res.json({
      online: 0,
      max: 20,
      players: []
    });
  } catch (error) {
    console.error('Erro em /api/players:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/server/start
app.post('/api/server/start', async (req, res) => {
  try {
    await runCommand(`sudo systemctl start ${CONFIG.serviceName}`);
    res.json({ success: true, message: 'Servidor iniciado' });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/server/stop
app.post('/api/server/stop', async (req, res) => {
  try {
    await runCommand(`sudo systemctl stop ${CONFIG.serviceName}`);
    res.json({ success: true, message: 'Servidor parado' });
  } catch (error) {
    console.error('Erro ao parar servidor:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/server/restart
app.post('/api/server/restart', async (req, res) => {
  try {
    await runCommand(`sudo systemctl restart ${CONFIG.serviceName}`);
    res.json({ success: true, message: 'Servidor reiniciado' });
  } catch (error) {
    console.error('Erro ao reiniciar servidor:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/logs - Retorna últimas linhas do log
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

// GET /api/files - Lista arquivos do servidor
app.get('/api/files', async (req, res) => {
  try {
    const dir = req.query.path || CONFIG.serverDir;
    const safePath = path.resolve(CONFIG.serverDir, dir.replace(CONFIG.serverDir, ''));
    
    // Segurança: não permitir acesso fora do diretório do servidor
    if (!safePath.startsWith(CONFIG.serverDir)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const items = fs.readdirSync(safePath, { withFileTypes: true });
    const files = items.map(item => ({
      name: item.name,
      type: item.isDirectory() ? 'folder' : 'file',
      path: path.join(safePath, item.name),
      size: item.isFile() ? fs.statSync(path.join(safePath, item.name)).size : null,
    }));

    res.json({ path: safePath, files });
  } catch (error) {
    console.error('Erro em /api/files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Hytale API Server rodando na porta ${PORT}`);
  console.log(`📊 Endpoints disponíveis:`);
  console.log(`   GET  /api/stats`);
  console.log(`   GET  /api/players`);
  console.log(`   GET  /api/logs`);
  console.log(`   GET  /api/files`);
  console.log(`   POST /api/server/start`);
  console.log(`   POST /api/server/stop`);
  console.log(`   POST /api/server/restart`);
});
