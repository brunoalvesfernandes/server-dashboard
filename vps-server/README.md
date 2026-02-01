# 🎮 Hytale Panel - Self-Hosting

Painel de administração para servidor Hytale rodando 100% na sua VPS.

## 📋 Requisitos

- VPS com Linux (Ubuntu/Debian recomendado)
- Node.js 18+ 
- Servidor Hytale configurado como serviço systemd

## 🚀 Instalação Rápida

```bash
# 1. Clone/Copie a pasta vps-server para sua VPS

# 2. Execute o script de instalação
chmod +x install.sh
./install.sh

# 3. Faça o build do frontend no seu computador
npm run build

# 4. Copie a pasta dist para a VPS
scp -r dist/ usuario@sua-vps:/caminho/para/vps-server/

# 5. Inicie o painel
pm2 start server.js --name hytale-panel
```

## 📁 Estrutura

```
vps-server/
├── server.js      # Servidor Express (API + Frontend)
├── package.json   # Dependências
├── install.sh     # Script de instalação
├── README.md      # Este arquivo
└── dist/          # Build do React (você precisa copiar)
```

## ⚙️ Configuração

Variáveis de ambiente (opcionais):

```bash
PORT=3007              # Porta do servidor (padrão: 3007)
SERVICE_NAME=hytale.service  # Nome do serviço systemd
SERVER_DIR=/opt/hytale       # Diretório do servidor Hytale
```

Exemplo:
```bash
PORT=8080 SERVICE_NAME=minecraft.service pm2 start server.js --name panel
```

## 🔐 Permissões

O script de instalação configura automaticamente as permissões necessárias para controlar o serviço sem senha sudo.

Se precisar fazer manualmente:

```bash
sudo visudo -f /etc/sudoers.d/hytale-panel
```

Adicione:
```
usuario ALL=(ALL) NOPASSWD: /bin/systemctl start hytale.service, /bin/systemctl stop hytale.service, /bin/systemctl restart hytale.service, /bin/systemctl is-active hytale.service, /bin/journalctl -u hytale.service *
```

## 🔄 Atualizando

1. Faça as mudanças no projeto Lovable
2. Build: `npm run build`
3. Copie para VPS: `scp -r dist/ usuario@vps:/caminho/vps-server/`
4. Reinicie: `pm2 restart hytale-panel`

## 📊 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/stats` | CPU, RAM, Disco, Status |
| GET | `/api/players` | Lista de jogadores |
| GET | `/api/logs?lines=100` | Logs do servidor |
| GET | `/api/files?path=` | Listar arquivos |
| POST | `/api/server/start` | Iniciar servidor |
| POST | `/api/server/stop` | Parar servidor |
| POST | `/api/server/restart` | Reiniciar servidor |

## 🛠️ Comandos Úteis

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs hytale-panel

# Reiniciar
pm2 restart hytale-panel

# Parar
pm2 stop hytale-panel

# Iniciar no boot
pm2 startup
pm2 save
```
