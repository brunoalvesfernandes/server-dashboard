#!/bin/bash

# ═══════════════════════════════════════════════════════════
# Script de Instalação - Hytale Panel
# ═══════════════════════════════════════════════════════════

set -e

echo ""
echo "🎮 ═══════════════════════════════════════════════════════"
echo "   HYTALE PANEL - Instalação"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Verifica se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instalando..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✅ Node.js versão: $(node -v)"

# Instala dependências
echo ""
echo "📦 Instalando dependências..."
npm install

# Verifica se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo ""
    echo "📦 Instalando PM2..."
    sudo npm install -g pm2
fi

# Configura sudoers para systemctl (sem senha)
echo ""
echo "🔐 Configurando permissões para systemctl..."
SUDOERS_LINE="$USER ALL=(ALL) NOPASSWD: /bin/systemctl start hytale.service, /bin/systemctl stop hytale.service, /bin/systemctl restart hytale.service, /bin/systemctl is-active hytale.service, /bin/journalctl -u hytale.service *"

if ! sudo grep -q "hytale.service" /etc/sudoers.d/hytale-panel 2>/dev/null; then
    echo "$SUDOERS_LINE" | sudo tee /etc/sudoers.d/hytale-panel > /dev/null
    sudo chmod 440 /etc/sudoers.d/hytale-panel
    echo "✅ Permissões configuradas"
else
    echo "✅ Permissões já configuradas"
fi

# Verifica se a pasta dist existe
if [ ! -d "dist" ]; then
    echo ""
    echo "⚠️  ATENÇÃO: Pasta 'dist' não encontrada!"
    echo "   Você precisa fazer o build do frontend e copiar para cá:"
    echo ""
    echo "   No seu computador local (projeto Lovable):"
    echo "   1. npm run build"
    echo "   2. scp -r dist/ usuario@sua-vps:/caminho/para/vps-server/"
    echo ""
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "   ✅ Instalação concluída!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "   Para iniciar o painel:"
echo "   └── pm2 start server.js --name hytale-panel"
echo ""
echo "   Para iniciar automaticamente no boot:"
echo "   └── pm2 startup && pm2 save"
echo ""
echo "   Para ver logs:"
echo "   └── pm2 logs hytale-panel"
echo ""
