import { useState, useEffect } from "react";
import { Search, Crown, Shield, User, MoreVertical, Ban, MessageSquare, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type Player as ApiPlayer } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Interface atualizada para corresponder ao backend
interface Player extends ApiPlayer {
  afk: boolean;
}

const roleConfig: Record<string, { icon: typeof Crown | typeof Shield | typeof User; color: string; bg: string; label: string }> = {
  owner: { icon: Crown, color: 'text-warning', bg: 'bg-warning/20', label: 'Dono' },
  admin: { icon: Shield, color: 'text-destructive', bg: 'bg-destructive/20', label: 'Admin' },
  mod: { icon: Shield, color: 'text-primary', bg: 'bg-primary/20', label: 'Mod' },
  vip: { icon: Crown, color: 'text-accent', bg: 'bg-accent/20', label: 'VIP' },
  player: { icon: User, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Player' },
};

const statusConfig = {
  online: { color: 'bg-success', label: 'Online' },
  afk: { color: 'bg-warning', label: 'AFK' },
  busy: { color: 'bg-destructive', label: 'Ocupado' },
};

export function PlayersList() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [online, setOnline] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Buscar players reais da API
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const data = await api.getPlayers();
        // Adiciona a propriedade afk aos players (convertendo role para lowercase para compatibilidade)
        const playersWithAfk = data.players.map(player => ({
          ...player,
          afk: false, // O backend deve enviar isso, mas por enquanto definimos como false
          role: player.role.toLowerCase() // Converte para lowercase para compatibilidade com roleConfig
        }));
        setPlayers(playersWithAfk);
        setOnline(data.online);
      } catch (e) {
        console.error("Erro ao buscar players", e);
      }
    };

    loadPlayers();
    const interval = setInterval(loadPlayers, 2000); // Atualiza a cada 2s

    return () => clearInterval(interval);
  }, []);

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || player.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            Players Online
            <span className="px-2 py-0.5 text-sm bg-success/20 text-success rounded-full">
              {online}
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {players.length} jogadores no total
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-48"
            />
          </div>
          
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">Todos</option>
            <option value="owner">Dono</option>
            <option value="admin">Admin</option>
            <option value="mod">Mod</option>
            <option value="vip">VIP</option>
            <option value="player">Player</option>
          </select>
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto scrollbar-thin pr-2">
        {filteredPlayers.map((player, index) => {
          const role = roleConfig[player.role] || roleConfig.player;
          const status = player.afk ? statusConfig.afk : statusConfig.online;
          const RoleIcon = role.icon;

          return (
            <div 
              key={player.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50 hover:border-primary/30 transition-all duration-200 group",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Avatar */}
              <div className="relative">
                <img 
                  src={player.avatar} 
                  alt={player.name}
                  className="w-12 h-12 rounded-xl bg-muted"
                />
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card",
                  status.color
                )} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{player.name}</span>
                  <div className={cn("p-1 rounded", role.bg)}>
                    <RoleIcon className={cn("w-3 h-3", role.color)} />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className={cn(
                    "flex items-center gap-1",
                    player.ping < 50 ? "text-success" : player.ping < 100 ? "text-warning" : "text-destructive"
                  )}>
                    {player.ping}ms
                  </span>
                  <span>{player.joinedAt}</span>
                </div>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-lg hover:bg-muted opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="cursor-pointer">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Enviar mensagem
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Ver perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-warning">
                    <UserX className="w-4 h-4 mr-2" />
                    Kickar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-destructive">
                    <Ban className="w-4 h-4 mr-2" />
                    Banir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum player encontrado</p>
        </div>
      )}
    </div>
  );
}
