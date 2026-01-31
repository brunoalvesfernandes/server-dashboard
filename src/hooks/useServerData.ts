import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ServerStats {
  cpu: number;
  ram: number;
  disk: number;
  serverStatus: 'online' | 'offline';
  uptime: string;
  totalRam: number;
  usedRam: number;
}

interface Player {
  id: string;
  name: string;
  role: string;
  avatar: string;
  joinedAt: string;
  ping: number;
}

interface PlayersData {
  online: number;
  max: number;
  players: Player[];
}

// Flag para usar dados mockados (altere para false quando a API estiver configurada)
const USE_MOCK_DATA = true;

// Dados mockados para desenvolvimento
const mockStats: ServerStats = {
  cpu: 45,
  ram: 62,
  disk: 38,
  serverStatus: 'online',
  uptime: '5h 23m',
  totalRam: 8,
  usedRam: 5,
};

const mockPlayers: PlayersData = {
  online: 12,
  max: 50,
  players: [
    { id: '1', name: 'DragonSlayer', role: 'Admin', avatar: '🐉', joinedAt: '2h ago', ping: 45 },
    { id: '2', name: 'CraftMaster', role: 'Mod', avatar: '⚔️', joinedAt: '1h ago', ping: 78 },
    { id: '3', name: 'BlockBuilder', role: 'VIP', avatar: '🏰', joinedAt: '45m ago', ping: 23 },
    { id: '4', name: 'NightWalker', role: 'Player', avatar: '🌙', joinedAt: '30m ago', ping: 156 },
    { id: '5', name: 'SkyHunter', role: 'Player', avatar: '🦅', joinedAt: '15m ago', ping: 89 },
  ],
};

export function useServerData() {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [players, setPlayers] = useState<PlayersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    if (USE_MOCK_DATA) {
      // Simula variação nos dados mockados
      setStats({
        ...mockStats,
        cpu: Math.round((mockStats.cpu + (Math.random() - 0.5) * 10) * 10) / 10,
        ram: Math.round((mockStats.ram + (Math.random() - 0.5) * 5) * 10) / 10,
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('server-proxy', {
        body: {},
      });

      if (error) throw error;
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar stats:', err);
      setError('Falha ao conectar com o servidor');
    }
  }, []);

  const fetchPlayers = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setPlayers(mockPlayers);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('server-proxy', {
        body: { endpoint: 'players' },
      });

      if (error) throw error;
      setPlayers(data);
    } catch (err) {
      console.error('Erro ao buscar players:', err);
    }
  }, []);

  const serverAction = useCallback(async (action: 'start' | 'stop' | 'restart') => {
    if (USE_MOCK_DATA) {
      toast({
        title: 'Modo Demo',
        description: `Ação "${action}" simulada. Configure a API para ações reais.`,
      });
      return { success: true };
    }

    try {
      const { data, error } = await supabase.functions.invoke('server-proxy', {
        body: { endpoint: `server/${action}` },
      });

      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: data.message,
      });
      
      // Atualiza stats após ação
      setTimeout(fetchStats, 2000);
      return data;
    } catch (err) {
      console.error(`Erro ao ${action} servidor:`, err);
      toast({
        title: 'Erro',
        description: `Falha ao ${action} o servidor`,
        variant: 'destructive',
      });
      throw err;
    }
  }, [fetchStats, toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchPlayers()]);
      setLoading(false);
    };

    loadData();

    // Atualiza a cada 5 segundos
    const interval = setInterval(() => {
      fetchStats();
      fetchPlayers();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchStats, fetchPlayers]);

  return {
    stats,
    players,
    loading,
    error,
    refetch: () => Promise.all([fetchStats(), fetchPlayers()]),
    serverAction,
    isUsingMockData: USE_MOCK_DATA,
  };
}
