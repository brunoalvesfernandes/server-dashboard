import { useState, useEffect, useRef, useCallback } from "react";
import { Terminal, RefreshCw, Download, Trash2, Search } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ServerConsoleProps {
  maxLines?: number;
}

export function ServerConsole({ maxLines = 200 }: ServerConsoleProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState("");
  const consoleRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getLogs(maxLines);
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Erro ao buscar logs:", err);
      setError("Falha ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  }, [maxLines]);

  useEffect(() => {
    fetchLogs();
    
    // Atualiza logs a cada 3 segundos
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleClear = () => {
    setLogs([]);
  };

  const handleDownload = () => {
    const content = logs.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `server-logs-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = filter
    ? logs.filter((log) => log.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  const getLogColor = (log: string) => {
    if (log.includes("ERROR") || log.includes("error") || log.includes("Exception")) {
      return "text-destructive";
    }
    if (log.includes("WARN") || log.includes("warn")) {
      return "text-warning";
    }
    if (log.includes("INFO") || log.includes("info")) {
      return "text-primary";
    }
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filtrar logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Atualizar
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Baixar
            </button>

            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-3 py-2 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </button>
          </div>

          {/* Auto-scroll toggle */}
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-border"
            />
            Auto-scroll
          </label>
        </div>
      </div>

      {/* Console Output */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Console do Servidor</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {filteredLogs.length} linhas
          </span>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <p className="text-destructive mb-2">{error}</p>
            <button
              onClick={fetchLogs}
              className="text-sm text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div
            ref={consoleRef}
            className="h-[500px] overflow-y-auto font-mono text-xs p-4 bg-[#0d1117] scrollbar-thin"
          >
            {loading && logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                Carregando logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {filter ? "Nenhum log encontrado com esse filtro" : "Nenhum log disponível"}
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredLogs.map((log, index) => (
                  <div
                    key={index}
                    className={cn(
                      "py-0.5 hover:bg-white/5 rounded px-1 -mx-1",
                      getLogColor(log)
                    )}
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
