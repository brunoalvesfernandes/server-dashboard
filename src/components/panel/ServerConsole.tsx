import { useState, useEffect, useRef, useCallback } from "react";
import { Terminal, RefreshCw, Download, Trash2, Search, Send } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ServerConsoleProps {
  maxLines?: number;
}

export function ServerConsole({ maxLines = 200 }: ServerConsoleProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState("");
  const [command, setCommand] = useState("");
  const [sendingCommand, setSendingCommand] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const handleSendCommand = async () => {
    if (!command.trim() || sendingCommand) return;

    setSendingCommand(true);
    try {
      const result = await api.sendCommand(command.trim());

      // Adiciona ao histórico
      setCommandHistory(prev => [command.trim(), ...prev.slice(0, 49)]);
      setHistoryIndex(-1);

      toast({
        title: "Comando enviado",
        description: result.message,
      });

      setCommand("");

      // Atualiza logs após enviar comando
      setTimeout(fetchLogs, 500);
    } catch (err) {
      console.error("Erro ao enviar comando:", err);
      toast({
        title: "Erro",
        description: "Falha ao enviar comando",
        variant: "destructive",
      });
    } finally {
      setSendingCommand(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand("");
      }
    }
  };

  const filteredLogs = filter
    ? logs.filter((log) => log.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  const getLogColor = (log: string) => {
    const l = log.toLowerCase();

    // erros / exceções
    if (
      l.includes(" error") ||
      l.includes("[error") ||
      l.includes("exception") ||
      l.includes("fatal") ||
      l.includes("severe") ||
      l.includes("stacktrace")
    ) {
      return "text-red-400";
    }

    // warning
    if (l.includes("warn") || l.includes("[warn")) {
      return "text-yellow-300";
    }

    // eventos legais / status
    if (l.includes("started") || l.includes("online") || l.includes("listening")) {
      return "text-emerald-300";
    }

    // info (menos “azul chapado”)
    if (l.includes("info") || l.includes("[info")) {
      return "text-sky-300";
    }

    // comandos digitados / $ (opcional)
    if (l.trim().startsWith("$") || l.includes("comando")) {
      return "text-violet-300";
    }

    // padrão
    return "text-slate-300";
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
            className="h-[400px] overflow-y-auto font-mono text-xs p-4 bg-[#0d1117] scrollbar-thin"
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
                {filteredLogs.map((log, index) => {
                  const match = log.match(/\[(INFO|WARN|ERROR|FINE|DEBUG|TRACE)\]/i);
                  const level = match?.[1]?.toUpperCase();

                  const levelClass =
                    level === "ERROR" ? "text-red-400" :
                      level === "WARN" ? "text-yellow-300" :
                        level === "INFO" ? "text-sky-300" :
                          level === "DEBUG" || level === "TRACE" ? "text-slate-400" :
                            "text-slate-300";

                  return (
                    <div
                      key={index}
                      className={cn("py-0.5 hover:bg-white/5 rounded px-1 -mx-1 text-slate-200")}
                    >
                      {level ? (
                        <>
                          <span className={cn("mr-2", levelClass)}>[{level}]</span>
                          <span className={getLogColor(log)}>{log.replace(match![0], "").trim()}</span>
                        </>
                      ) : (
                        <span className={getLogColor(log)}>{log}</span>
                      )}
                    </div>
                  );
                })}

              </div>
            )}
          </div>
        )}

        {/* Command Input */}
        <div className="border-t border-border bg-[#0d1117] p-3">
          <div className="flex items-center gap-2">
            <span className="text-primary font-mono text-sm">$</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite um comando..."
              disabled={sendingCommand}
              className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSendCommand}
              disabled={!command.trim() || sendingCommand}
              className={cn(
                "p-2 rounded-lg transition-colors",
                command.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/80"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Use ↑↓ para navegar no histórico de comandos
          </p>
        </div>
      </div>
    </div>
  );
}
