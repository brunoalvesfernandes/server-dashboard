import { useState, useEffect, useCallback } from "react";
import { 
  Shield, 
  RefreshCw, 
  Loader2,
  Package,
  FileCode,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Plugin {
  name: string;
  version: string;
  enabled: boolean;
  description: string;
  file: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function ServerPlugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPlugins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPlugins();
      setPlugins(data.plugins || []);
    } catch (err) {
      console.error('Erro ao buscar plugins:', err);
      setError('Falha ao carregar plugins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const enabledCount = plugins.filter(p => p.enabled).length;
  const disabledCount = plugins.filter(p => !p.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-semibold">Plugins & Mods</h3>
            <p className="text-sm text-muted-foreground">
              Visualize os mods ativos no servidor
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-success/20 text-success rounded-lg text-sm">
              <CheckCircle className="w-4 h-4" />
              {enabledCount} ativos
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-sm">
              <XCircle className="w-4 h-4" />
              {disabledCount} inativos
            </div>
            
            <button
              onClick={fetchPlugins}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Plugins List */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-accent/20">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Mods Instalados</h3>
            <p className="text-xs text-muted-foreground">{plugins.length} plugins/mods encontrados</p>
          </div>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <p className="text-destructive mb-2">{error}</p>
            <button
              onClick={fetchPlugins}
              className="text-sm text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : plugins.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum plugin/mod encontrado</p>
            <p className="text-sm mt-1">Adicione mods na pasta mods/ ou plugins/</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plugins.map((plugin, index) => (
              <div
                key={plugin.file}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 animate-fade-in",
                  plugin.enabled 
                    ? "bg-success/5 border-success/30 hover:border-success/50" 
                    : "bg-secondary/50 border-border/50 hover:border-primary/30"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  plugin.enabled ? "bg-success/20" : "bg-muted"
                )}>
                  <FileCode className={cn(
                    "w-6 h-6",
                    plugin.enabled ? "text-success" : "text-muted-foreground"
                  )} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{plugin.name}</span>
                    {plugin.version && (
                      <span className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                        v{plugin.version}
                      </span>
                    )}
                  </div>
                  
                  {plugin.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {plugin.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {plugin.file}
                    </span>
                    <span className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full",
                      plugin.enabled 
                        ? "bg-success/20 text-success" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {plugin.enabled ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          Inativo
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="glass-card p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Sobre Plugins & Mods</p>
            <p>
              Os plugins são carregados automaticamente das pastas <code className="text-primary">plugins/</code> e <code className="text-primary">mods/</code> do servidor. 
              Para adicionar novos, use o Gerenciador de Arquivos ou faça upload diretamente nessas pastas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
