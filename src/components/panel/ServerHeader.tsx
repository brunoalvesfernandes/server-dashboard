import { Bell, Search, User, ChevronDown, Settings, LogOut, HelpCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/AuthGuard";
import heroBanner from "@/assets/hero-banner.jpg";

interface ServerHeaderProps {
  serverName?: string;
}

export function ServerHeader({ serverName = "Hytale Brasil" }: ServerHeaderProps) {
  const { user, logout } = useAuth();
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Left - Server Info */}
        <div className="flex items-center gap-4">
          <div 
            className="w-10 h-10 rounded-xl bg-cover bg-center border border-border"
            style={{ backgroundImage: `url(${heroBanner})` }}
          />
          <div>
            <h2 className="font-display font-bold text-lg">{serverName}</h2>
            <p className="text-xs text-muted-foreground">Servidor de Hytale</p>
          </div>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar comandos, configurações..."
              className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>

          {/* Help */}
          <button className="p-2 rounded-lg hover:bg-muted transition-colors hidden sm:flex">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-muted transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium hidden sm:block capitalize">{user || 'Admin'}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="font-medium capitalize">{user || 'Administrador'}</p>
                <p className="text-xs text-muted-foreground">{user}@hytale.net</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
