import { useState } from "react";
import { ServerSidebar } from "@/components/panel/ServerSidebar";
import { ServerHeader } from "@/components/panel/ServerHeader";
import { StatsCard } from "@/components/panel/StatsCard";
import { SystemCharts } from "@/components/panel/SystemCharts";
import { PlayersList } from "@/components/panel/PlayersList";
import { FileUploader } from "@/components/panel/FileUploader";
import { ServerConsole } from "@/components/panel/ServerConsole";
import { ServerSettings } from "@/components/panel/ServerSettings";
import { useServerData } from "@/hooks/useServerData";
import { Users, Cpu, HardDrive, Clock } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { stats, players } = useServerData();

  const renderContent = () => {
    switch (activeTab) {
      case 'files':
        return <FileUploader />;
      case 'players':
        return <PlayersList />;
      case 'resources':
        return <SystemCharts />;
      case 'console':
        return <ServerConsole />;
      case 'settings':
        return <ServerSettings />;
      default:
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Players Online"
                value={players?.online || 0}
                subtitle={`de ${players?.max || 50} slots`}
                icon={Users}
                variant="primary"
              />
              <StatsCard
                title="Uso de CPU"
                value={`${stats?.cpu || 0}%`}
                subtitle="Processador"
                icon={Cpu}
                variant="success"
              />
              <StatsCard
                title="Memória RAM"
                value={`${stats?.usedRam || 0} GB`}
                subtitle={`de ${stats?.totalRam || 0} GB alocados`}
                icon={HardDrive}
                variant="warning"
              />
              <StatsCard
                title="Uptime"
                value={stats?.uptime || '-'}
                subtitle="Tempo online"
                icon={Clock}
                variant="default"
              />
            </div>

            {/* Charts */}
            <SystemCharts />

            {/* Players */}
            <PlayersList />
          </div>
        );
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'files': return 'Gerenciador de Arquivos';
      case 'players': return 'Players Online';
      case 'resources': return 'Recursos do Sistema';
      case 'console': return 'Console';
      case 'backups': return 'Backups';
      case 'plugins': return 'Plugins & Mods';
      case 'settings': return 'Configurações';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <ServerSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="ml-64">
        <ServerHeader />
        
        <main className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold mb-1">{getPageTitle()}</h1>
            <p className="text-muted-foreground">
              {activeTab === 'dashboard' && 'Visão geral do seu servidor'}
              {activeTab === 'files' && 'Gerencie arquivos, mods e plugins'}
              {activeTab === 'players' && 'Veja e gerencie jogadores conectados'}
              {activeTab === 'resources' && 'Monitore o desempenho do servidor'}
            </p>
          </div>

          {/* Dynamic Content */}
          {renderContent()}
        </main>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default Index;
