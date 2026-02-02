import { useState } from "react";
import { 
  Home, 
  FolderOpen, 
  Users, 
  Activity, 
  Settings, 
  Terminal,
  Power,
  Database,
  Shield,
  RotateCw,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useServerData } from "@/hooks/useServerData";

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Dashboard", id: "dashboard" },
  { icon: FolderOpen, label: "Arquivos", id: "files" },
  { icon: Users, label: "Players", id: "players" },
  { icon: Activity, label: "Recursos", id: "resources" },
  { icon: Terminal, label: "Console", id: "console" },
  { icon: Database, label: "Backups", id: "backups" },
  { icon: Shield, label: "Plugins", id: "plugins" },
  { icon: Settings, label: "Config", id: "settings" },
];

interface ServerSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ServerSidebar({ activeTab, onTabChange }: ServerSidebarProps) {
  const { stats, players, serverAction } = useServerData();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const serverStatus = stats?.serverStatus || 'offline';
  const onlinePlayers = players?.online || 0;

  const handleServerAction = async (action: 'start' | 'stop' | 'restart') => {
    if (actionLoading) return;
    
    setActionLoading(action);
    try {
      await serverAction(action);
    } finally {
      setActionLoading(null);
    }
  };

  // Update nav items with player count
  const navItemsWithBadges = navItems.map(item => ({
    ...item,
    badge: item.id === 'players' ? onlinePlayers : undefined,
  }));

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0">
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <div className="w-6 h-6 rounded bg-primary animate-pulse-slow" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-gradient-primary">
              HYTALE
            </h1>
            <p className="text-xs text-muted-foreground">Server Panel</p>
          </div>
        </div>
      </div>

      {/* Server Status Card */}
      <div className="p-4">
        <div className="glass-card p-4 glow-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Status</span>
            <div className={cn(
              "flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full",
              serverStatus === 'online' && "bg-success/20 text-success",
              serverStatus === 'offline' && "bg-destructive/20 text-destructive"
            )}>
              <span className={cn(
                "w-2 h-2 rounded-full",
                serverStatus === 'online' && "bg-success",
                serverStatus === 'offline' && "bg-destructive"
              )} />
              {serverStatus === 'online' ? "Online" : "Offline"}
            </div>
          </div>
          
          <div className="flex gap-2">
            {serverStatus === 'online' ? (
              <>
                <button 
                  onClick={() => handleServerAction('stop')}
                  disabled={!!actionLoading}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                    "bg-destructive/20 text-destructive hover:bg-destructive/30",
                    actionLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {actionLoading === 'stop' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Power className="w-4 h-4" />
                  )}
                  Parar
                </button>
                <button 
                  onClick={() => handleServerAction('restart')}
                  disabled={!!actionLoading}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                    "bg-warning/20 text-warning hover:bg-warning/30",
                    actionLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {actionLoading === 'restart' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCw className="w-4 h-4" />
                  )}
                </button>
              </>
            ) : (
              <button 
                onClick={() => handleServerAction('start')}
                disabled={!!actionLoading}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                  "bg-success/20 text-success hover:bg-success/30",
                  actionLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                {actionLoading === 'start' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Power className="w-4 h-4" />
                )}
                Iniciar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItemsWithBadges.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-primary/20 text-primary" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform duration-200",
                isActive && "text-primary",
                "group-hover:scale-110"
              )} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  isActive 
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {item.badge}
                </span>
              )}
              {isActive && (
                <div className="w-1 h-6 bg-primary rounded-full absolute right-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Server Info Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>IP:</span>
            <span className="text-foreground font-mono">play.hytale.net</span>
          </div>
          <div className="flex justify-between">
            <span>Porta:</span>
            <span className="text-foreground font-mono">25565</span>
          </div>
          <div className="flex justify-between">
            <span>Uptime:</span>
            <span className="text-foreground">{stats?.uptime || '-'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}