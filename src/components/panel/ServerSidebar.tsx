import { 
  Home, 
  FolderOpen, 
  Users, 
  Activity, 
  Settings, 
  Terminal,
  Power,
  Database,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Dashboard", id: "dashboard" },
  { icon: FolderOpen, label: "Arquivos", id: "files" },
  { icon: Users, label: "Players", id: "players", badge: 12 },
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
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'starting'>('online');

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
              serverStatus === 'offline' && "bg-destructive/20 text-destructive",
              serverStatus === 'starting' && "bg-warning/20 text-warning"
            )}>
              <span className={cn(
                "w-2 h-2 rounded-full",
                serverStatus === 'online' && "bg-success",
                serverStatus === 'offline' && "bg-destructive",
                serverStatus === 'starting' && "bg-warning animate-pulse"
              )} />
              {serverStatus === 'online' && "Online"}
              {serverStatus === 'offline' && "Offline"}
              {serverStatus === 'starting' && "Iniciando..."}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setServerStatus(serverStatus === 'online' ? 'offline' : 'starting')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                serverStatus === 'online' 
                  ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                  : "bg-success/20 text-success hover:bg-success/30"
              )}
            >
              <Power className="w-4 h-4" />
              {serverStatus === 'online' ? 'Parar' : 'Iniciar'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
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
              {item.badge && (
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
            <span>Versão:</span>
            <span className="text-foreground">1.0.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
