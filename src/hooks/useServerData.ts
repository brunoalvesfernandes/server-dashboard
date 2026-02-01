import { useState, useEffect, useCallback } from 'react';
import { api, ServerStats, PlayersData } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function useServerData() {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [players, setPlayers] = useState<PlayersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar stats:', err);
      setError('Falha ao conectar com o servidor');
    }
  }, []);

  const fetchPlayers = useCallback(async () => {
    try {
      const data = await api.getPlayers();
      setPlayers(data);
    } catch (err) {
      console.error('Erro ao buscar players:', err);
    }
  }, []);

  const serverAction = useCallback(async (action: 'start' | 'stop' | 'restart') => {
    try {
      const result = await api.serverAction(action);
      
      toast({
        title: api.isLovablePreview ? 'Modo Demo' : 'Sucesso',
        description: result.message,
      });
      
      // Atualiza stats após ação
      setTimeout(fetchStats, 2000);
      return result;
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
    isUsingMockData: api.isLovablePreview,
  };
}
