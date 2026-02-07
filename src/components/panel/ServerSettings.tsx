import { useState, useEffect } from "react";
import { Save, Server, Lock, Network, RefreshCw, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { api, ServerConfig } from "@/lib/api";

export function ServerSettings() {
  const [config, setConfig] = useState<ServerConfig>({
    serverName: "Hytale Brasil",
    serverIp: "168.75.85.54",
    serverPort: "25565",
    maxPlayers: "50",
    motd: "Bem-vindo ao servidor Hytale!",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const { toast } = useToast();

  // Carrega configurações do backend
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await api.getConfig();
        setConfig(data);
      } catch (err) {
        console.error('Erro ao carregar config:', err);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleConfigChange = (key: keyof ServerConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.saveConfig(config);
      
      toast({
        title: "Configurações salvas",
        description: "As configurações do servidor foram atualizadas",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso",
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao alterar senha",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Server Configuration */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/20">
            <Server className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Configurações do Servidor</h3>
            <p className="text-xs text-muted-foreground">Informações básicas do servidor</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do Servidor</label>
            <input
              type="text"
              value={config.serverName}
              onChange={(e) => handleConfigChange("serverName", e.target.value)}
              className="w-full px-4 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Nome do servidor"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">MOTD (Mensagem do Dia)</label>
            <input
              type="text"
              value={config.motd}
              onChange={(e) => handleConfigChange("motd", e.target.value)}
              className="w-full px-4 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Mensagem de boas-vindas"
            />
          </div>

        </div>

        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className={cn(
            "mt-6 flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            saving && "opacity-50 cursor-not-allowed"
          )}
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar Configurações
        </button>
      </div>

      {/* Network Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-success/20">
            <Network className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Configurações de Rede</h3>
            <p className="text-xs text-muted-foreground">IP e porta do servidor</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">IP do Servidor</label>
            <div className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-sm text-muted-foreground">
              {config.serverIp}
            </div>
            <p className="text-xs text-muted-foreground">
              Fixo - não editável
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Porta</label>
            <div className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-sm text-muted-foreground">
              {config.serverPort}
            </div>
            <p className="text-xs text-muted-foreground">
              Fixo - não editável
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Máximo de Players</label>
            <div className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-sm text-muted-foreground">
              {config.maxPlayers}
            </div>
            <p className="text-xs text-muted-foreground">
              Fixo - não editável
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border">
          <p className="text-sm font-medium mb-1">Endereço de conexão:</p>
          <code className="text-primary font-mono">
            {config.serverIp}:{config.serverPort}
          </code>
        </div>
      </div>

      {/* Change Password */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-warning/20">
            <Lock className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Alterar Senha</h3>
            <p className="text-xs text-muted-foreground">Altere a senha de acesso ao painel</p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="text-sm font-medium">Senha Atual</label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-4 py-2 pr-10 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Digite sua senha atual"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nova Senha</label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-4 py-2 pr-10 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Digite a nova senha"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirmar Nova Senha</label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-4 py-2 pr-10 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Confirme a nova senha"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
              "bg-warning text-warning-foreground hover:bg-warning/90",
              (changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) && "opacity-50 cursor-not-allowed"
            )}
          >
            {changingPassword ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            Alterar Senha
          </button>
        </div>
      </div>
    </div>
  );
}
