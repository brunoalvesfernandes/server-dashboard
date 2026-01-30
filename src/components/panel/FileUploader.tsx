import { useState, useCallback } from "react";
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
  CheckCircle,
  XCircle,
  Loader2,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  uploadedAt?: Date;
}

const mockFiles: UploadedFile[] = [
  { id: '1', name: 'server-config.yml', size: 24576, type: 'config', status: 'success', progress: 100, uploadedAt: new Date() },
  { id: '2', name: 'world-data.zip', size: 156789012, type: 'archive', status: 'success', progress: 100, uploadedAt: new Date() },
  { id: '3', name: 'custom-plugin.jar', size: 5678901, type: 'code', status: 'success', progress: 100, uploadedAt: new Date() },
  { id: '4', name: 'player-data.json', size: 12345, type: 'config', status: 'success', progress: 100, uploadedAt: new Date() },
  { id: '5', name: 'banner.png', size: 234567, type: 'image', status: 'success', progress: 100, uploadedAt: new Date() },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case 'image': return Image;
    case 'archive': return FileArchive;
    case 'code': return FileCode;
    case 'config': return FileText;
    default: return File;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) return 'image';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return 'archive';
  if (['jar', 'js', 'ts', 'py', 'java'].includes(ext || '')) return 'code';
  if (['yml', 'yaml', 'json', 'xml', 'toml', 'properties'].includes(ext || '')) return 'config';
  return 'file';
};

export function FileUploader() {
  const [files, setFiles] = useState<UploadedFile[]>(mockFiles);
  const [isDragging, setIsDragging] = useState(false);
  const [currentPath, setCurrentPath] = useState('/mods');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const simulateUpload = (file: File) => {
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: getFileType(file.name),
      status: 'uploading',
      progress: 0,
    };

    setFiles(prev => [newFile, ...prev]);

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles(prev => 
          prev.map(f => 
            f.id === newFile.id 
              ? { ...f, status: 'success', progress: 100, uploadedAt: new Date() }
              : f
          )
        );
      } else {
        setFiles(prev => 
          prev.map(f => 
            f.id === newFile.id ? { ...f, progress: Math.round(progress) } : f
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

  const handleDelete = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const paths = [
    { name: 'mods', path: '/mods', count: 23 },
    { name: 'plugins', path: '/plugins', count: 15 },
    { name: 'config', path: '/config', count: 42 },
    { name: 'worlds', path: '/worlds', count: 3 },
    { name: 'logs', path: '/logs', count: 156 },
  ];

  return (
    <div className="space-y-6">
      {/* Path Selector */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen className="w-5 h-5 text-primary" />
          <span className="font-medium">Diretório atual:</span>
          <span className="text-primary font-mono">{currentPath}</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {paths.map((path) => (
            <button
              key={path.path}
              onClick={() => setCurrentPath(path.path)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                currentPath === path.path
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
              )}
            >
              <FolderOpen className="w-4 h-4" />
              {path.name}
              <span className="px-1.5 py-0.5 text-xs bg-muted rounded">
                {path.count}
              </span>
            </button>
          ))}
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
          <h3 className="font-display font-semibold">Arquivos Recentes</h3>
          <button className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            Novo arquivo
          </button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
          {files.map((file, index) => {
            const FileIcon = getFileIcon(file.type);
            
            return (
              <div 
                key={file.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border/50 hover:border-primary/30 transition-all duration-200 group animate-fade-in"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  file.type === 'image' && "bg-pink-500/20 text-pink-500",
                  file.type === 'archive' && "bg-warning/20 text-warning",
                  file.type === 'code' && "bg-success/20 text-success",
                  file.type === 'config' && "bg-primary/20 text-primary",
                  file.type === 'file' && "bg-muted text-muted-foreground",
                )}>
                  <FileIcon className="w-5 h-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{file.name}</span>
                    {file.status === 'success' && (
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    )}
                    {file.status === 'error' && (
                      <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    )}
                  </div>
                  
                  {file.status === 'uploading' ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={file.progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">{file.progress}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{formatFileSize(file.size)}</span>
                      {file.uploadedAt && (
                        <span>{file.uploadedAt.toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {file.status === 'uploading' ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(file.id)}
                      className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
