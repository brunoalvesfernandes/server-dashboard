import { useState, useEffect, useCallback } from "react";
import { 
  Database, 
  Download, 
  Trash2, 
  RefreshCw, 
  Plus, 
  Loader2,
  Calendar,
  HardDrive,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Backup {
  name: string;
  size: number;
  createdAt: string;
  path: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function ServerBackups() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingBackup, setDeletingBackup] = useState<string | null>(null);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBackups();
      setBackups(data.backups || []);
    } catch (err) {
      console.error('Erro ao buscar backups:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar backups',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreateBackup = async () => {
    if (creating) return;
    
    setCreating(true);
    try {
      const result = await api.createBackup();
      toast({
        title: 'Sucesso',
        description: result.message,
      });
      fetchBackups();
    } catch (err) {
      console.error('Erro ao criar backup:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao criar backup',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBackup = async (backup: Backup) => {
    if (deletingBackup) return;
    
    setDeletingBackup(backup.name);
    try {
      await api.deleteBackup(backup.name);
      toast({
        title: 'Sucesso',
        description: `Backup ${backup.name} deletado`,
      });
      fetchBackups();
    } catch (err) {
      console.error('Erro ao deletar backup:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao deletar backup',
        variant: 'destructive',
      });
    } finally {
      setDeletingBackup(null);
    }
  };

  const handleRestoreBackup = async (backup: Backup) => {
    if (restoringBackup) return;
    
    if (!confirm(`Tem certeza que deseja restaurar o backup "${backup.name}"? Isso irá substituir os arquivos atuais do servidor.`)) {
      return;
    }
    
    setRestoringBackup(backup.name);
    try {
      const result = await api.restoreBackup(backup.name);
      toast({
        title: 'Sucesso',
        description: result.message,
      });
    } catch (err) {
      console.error('Erro ao restaurar backup:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao restaurar backup',
        variant: 'destructive',
      });
    } finally {
      setRestoringBackup(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-semibold">Backups do Servidor</h3>
            <p className="text-sm text-muted-foreground">
              Crie e gerencie backups do seu servidor
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBackups}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Atualizar
            </button>
            
            <button
              onClick={handleCreateBackup}
              disabled={creating}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                creating && "opacity-50 cursor-not-allowed"
              )}
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Criar Backup
            </button>
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/20">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Lista de Backups</h3>
            <p className="text-xs text-muted-foreground">{backups.length} backups disponíveis</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum backup encontrado</p>
            <p className="text-sm mt-1">Crie seu primeiro backup clicando no botão acima</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup, index) => (
              <div
                key={backup.name}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border/50",
                  "hover:border-primary/30 transition-all duration-200 group animate-fade-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Database className="w-6 h-6 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{backup.name}</span>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {formatFileSize(backup.size)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(backup.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleRestoreBackup(backup)}
                    disabled={!!restoringBackup}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      "bg-success/20 text-success hover:bg-success/30",
                      restoringBackup && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {restoringBackup === backup.name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Restaurar
                  </button>
                  
                  <button
                    onClick={() => handleDeleteBackup(backup)}
                    disabled={!!deletingBackup}
                    className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    {deletingBackup === backup.name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
