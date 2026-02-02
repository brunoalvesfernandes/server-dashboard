import { useState, useCallback, useEffect } from "react";
import { 
  Upload, 
  File, 
  FileText, 
  FileCode, 
  FileArchive, 
  Image,
  Trash2,
  Download,
  FolderOpen,
  Folder,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ServerFile {
  name: string;
  type: 'folder' | 'file';
  path: string;
  size: number | null;
}

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
}

const getFileIcon = (name: string, isFolder: boolean) => {
  if (isFolder) return Folder;
  const ext = name.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) return Image;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return FileArchive;
  if (['jar', 'js', 'ts', 'py', 'java'].includes(ext || '')) return FileCode;
  if (['yml', 'yaml', 'json', 'xml', 'toml', 'properties'].includes(ext || '')) return FileText;
  return File;
};

const formatFileSize = (bytes: number | null) => {
  if (bytes === null || bytes === 0) return '-';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FileUploader() {
  const [files, setFiles] = useState<ServerFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFiles = useCallback(async (path: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFiles(path);
      setFiles(data.files || []);
      setCurrentPath(data.path || '/');
    } catch (err) {
      console.error('Erro ao buscar arquivos:', err);
      setError('Falha ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const navigateTo = (path: string) => {
    fetchFiles(path);
  };

  const goBack = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    fetchFiles(parts.join('/'));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Breadcrumb
  const breadcrumbs = ['root', ...currentPath.split('/').filter(Boolean)];

  const uploadFile = async (file: File) => {
    const uploadId = Date.now().toString();
    const newUpload: UploadingFile = {
      id: uploadId,
      name: file.name,
      size: file.size,
      type: 'file',
      status: 'uploading',
      progress: 0,
    };

    setUploadingFiles(prev => [newUpload, ...prev]);

    try {
      // Update progress to show upload is happening
      setUploadingFiles(prev => 
        prev.map(f => f.id === uploadId ? { ...f, progress: 50 } : f)
      );

      await api.uploadFile(file, currentPath);

      setUploadingFiles(prev => 
        prev.map(f => 
          f.id === uploadId 
            ? { ...f, status: 'success', progress: 100 }
            : f
        )
      );

      toast({
        title: 'Sucesso',
        description: `${file.name} enviado com sucesso`,
      });

      // Refresh file list
      setTimeout(() => {
        fetchFiles(currentPath);
        // Remove from uploading list after a moment
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
        }, 2000);
      }, 500);
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      setUploadingFiles(prev => 
        prev.map(f => 
          f.id === uploadId 
            ? { ...f, status: 'error', progress: 0 }
            : f
        )
      );

      toast({
        title: 'Erro no upload',
        description: `Falha ao enviar ${file.name}`,
        variant: 'destructive',
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(uploadFile);
  }, [currentPath]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(uploadFile);
  };

  const handleDeleteUpload = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDeleteFile = async (file: ServerFile) => {
    if (deletingFile) return;
    
    setDeletingFile(file.path);
    try {
      await api.deleteFile(file.path);
      
      toast({
        title: 'Sucesso',
        description: `${file.name} deletado com sucesso`,
      });
      
      // Refresh file list
      fetchFiles(currentPath);
    } catch (err) {
      console.error('Erro ao deletar arquivo:', err);
      toast({
        title: 'Erro',
        description: `Falha ao deletar ${file.name}`,
        variant: 'destructive',
      });
    } finally {
      setDeletingFile(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {currentPath && currentPath !== '/' && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 px-2 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          )}
          
          <div className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                <button
                  onClick={() => {
                    if (index === 0) {
                      fetchFiles('');
                    } else {
                      const path = breadcrumbs.slice(1, index + 1).join('/');
                      fetchFiles(path);
                    }
                  }}
                  className={cn(
                    "px-2 py-1 rounded hover:bg-secondary transition-colors",
                    index === breadcrumbs.length - 1 ? "text-primary font-medium" : "text-muted-foreground"
                  )}
                >
                  {crumb}
                </button>
              </span>
            ))}
          </div>

          <button
            onClick={() => fetchFiles(currentPath)}
            disabled={loading}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "glass-card p-8 border-2 border-dashed transition-all duration-300 cursor-pointer",
          isDragging 
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-border hover:border-primary/50"
        )}
      >
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center text-center">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300",
              isDragging ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"
            )}>
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">
              {isDragging ? "Solte os arquivos aqui!" : "Upload de Arquivos"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Arraste e solte seus arquivos ou clique para selecionar
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 bg-muted rounded">.jar</span>
              <span className="px-2 py-1 bg-muted rounded">.zip</span>
              <span className="px-2 py-1 bg-muted rounded">.yml</span>
              <span className="px-2 py-1 bg-muted rounded">.json</span>
              <span className="px-2 py-1 bg-muted rounded">...</span>
            </div>
          </div>
        </label>
      </div>

      {/* File List */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">
            {currentPath ? `Arquivos em /${currentPath}` : 'Arquivos'}
          </h3>
          <span className="text-sm text-muted-foreground">
            {files.length} itens
          </span>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <p className="text-destructive mb-2">{error}</p>
            <button
              onClick={() => fetchFiles(currentPath)}
              className="text-sm text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : files.length === 0 && uploadingFiles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Diretório vazio</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
            {/* Uploading files */}
            {uploadingFiles.map((file) => (
              <div 
                key={file.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border",
                  file.status === 'uploading' && "bg-primary/10 border-primary/30",
                  file.status === 'success' && "bg-success/10 border-success/30",
                  file.status === 'error' && "bg-destructive/10 border-destructive/30"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  file.status === 'uploading' && "bg-primary/20 text-primary",
                  file.status === 'success' && "bg-success/20 text-success",
                  file.status === 'error' && "bg-destructive/20 text-destructive"
                )}>
                  {file.status === 'uploading' && <Loader2 className="w-5 h-5 animate-spin" />}
                  {file.status === 'success' && <CheckCircle className="w-5 h-5" />}
                  {file.status === 'error' && <XCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{file.name}</span>
                  {file.status === 'uploading' && (
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={file.progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">{file.progress}%</span>
                    </div>
                  )}
                  {file.status === 'success' && (
                    <span className="text-xs text-success">Upload concluído</span>
                  )}
                  {file.status === 'error' && (
                    <span className="text-xs text-destructive">Falha no upload</span>
                  )}
                </div>
                <button 
                  onClick={() => handleDeleteUpload(file.id)}
                  className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Server files */}
            {files.map((file, index) => {
              const FileIcon = getFileIcon(file.name, file.type === 'folder');
              const isFolder = file.type === 'folder';
              const isDeleting = deletingFile === file.path;
              
              return (
                <div 
                  key={`${file.path}-${index}`}
                  onClick={() => isFolder && navigateTo(file.path)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border/50 hover:border-primary/30 transition-all duration-200 group animate-fade-in",
                    isFolder && "cursor-pointer hover:bg-secondary/80"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isFolder ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary"
                  )}>
                    <FileIcon className="w-5 h-5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{file.name}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{isFolder ? 'Pasta' : formatFileSize(file.size)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isFolder && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file);
                        }}
                        disabled={isDeleting}
                        className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                  
                  {isFolder && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}