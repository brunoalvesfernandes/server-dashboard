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
  Plus,
  ChevronRight,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

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

  const simulateUpload = (file: File) => {
    const newUpload: UploadingFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: 'file',
      status: 'uploading',
      progress: 0,
    };

    setUploadingFiles(prev => [newUpload, ...prev]);

    // Simulate upload progress (em produção, usar FormData + fetch)
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === newUpload.id 
              ? { ...f, status: 'success', progress: 100 }
              : f
          )
        );
        // Atualiza lista após upload
        setTimeout(() => fetchFiles(currentPath), 500);
      } else {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === newUpload.id ? { ...f, progress: Math.round(progress) } : f
          )
        );
      }
    }, 200);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(simulateUpload);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(simulateUpload);
  };

  const handleDeleteUpload = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
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
        ) : files.length === 0 ? (
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
                className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/30"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/20 text-primary">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{file.name}</span>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={file.progress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">{file.progress}%</span>
                  </div>
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
