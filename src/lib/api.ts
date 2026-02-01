/**
 * API Client para comunicação com o servidor
 * 
 * Em modo desenvolvimento (Lovable), usa dados mockados
 * Em produção (VPS), faz chamadas reais para /api/*
 */

// Detecta se está rodando no Lovable ou na VPS
const isLovablePreview = window.location.hostname.includes('lovable.app') || 
                          window.location.hostname === 'localhost';

// URL base da API (em produção, é o mesmo servidor)
const API_BASE = isLovablePreview ? '' : '';

export interface ServerStats {
  cpu: number;
  ram: number;
  disk: number;
  serverStatus: 'online' | 'offline';
  uptime: string;
  totalRam: number;
  usedRam: number;
}

export interface Player {
  id: string;
  name: string;
  role: string;
  avatar: string;
  joinedAt: string;
  ping: number;
}

export interface PlayersData {
  online: number;
  max: number;
  players: Player[];
}

// Dados mockados para desenvolvimento no Lovable
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

// Função auxiliar para requests
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (isLovablePreview) {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Retorna dados mockados baseado no endpoint
    if (endpoint === '/api/stats') {
      return {
        ...mockStats,
        cpu: Math.round((mockStats.cpu + (Math.random() - 0.5) * 10) * 10) / 10,
        ram: Math.round((mockStats.ram + (Math.random() - 0.5) * 5) * 10) / 10,
      } as T;
    }
    if (endpoint === '/api/players') {
      return mockPlayers as T;
    }
    if (endpoint.startsWith('/api/server/')) {
      return { success: true, message: 'Ação simulada (modo demo)' } as T;
    }
    throw new Error('Endpoint não encontrado');
  }

  // Chamada real para a API
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Exporta funções da API
export const api = {
  getStats: () => apiRequest<ServerStats>('/api/stats'),
  getPlayers: () => apiRequest<PlayersData>('/api/players'),
  serverAction: (action: 'start' | 'stop' | 'restart') => 
    apiRequest<{ success: boolean; message: string }>(`/api/server/${action}`, { method: 'POST' }),
  getLogs: (lines = 100) => apiRequest<{ logs: string[] }>(`/api/logs?lines=${lines}`),
  getFiles: (path = '') => apiRequest<{ path: string; files: any[] }>(`/api/files?path=${encodeURIComponent(path)}`),
  isLovablePreview,
};
