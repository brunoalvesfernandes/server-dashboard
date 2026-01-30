import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Cpu, MemoryStick, HardDrive, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemData {
  time: string;
  cpu: number;
  ram: number;
  disk: number;
  network: number;
}

const generateInitialData = (): SystemData[] => {
  const data: SystemData[] = [];
  for (let i = 29; i >= 0; i--) {
    const time = new Date(Date.now() - i * 2000);
    data.push({
      time: time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      cpu: Math.floor(Math.random() * 40) + 20,
      ram: Math.floor(Math.random() * 30) + 45,
      disk: Math.floor(Math.random() * 10) + 35,
      network: Math.floor(Math.random() * 50) + 10,
    });
  }
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-border">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground capitalize">{entry.name}:</span>
            <span className="font-medium">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

function MetricCard({ icon: Icon, label, value, color, bgColor }: MetricCardProps) {
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className={cn("p-3 rounded-xl", bgColor)}>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all duration-500")}
              style={{ 
                width: `${value}%`,
                background: color.includes('primary') 
                  ? 'linear-gradient(90deg, hsl(174 100% 50%), hsl(200 100% 50%))'
                  : color.includes('accent')
                    ? 'linear-gradient(90deg, hsl(280 100% 60%), hsl(320 100% 60%))'
                    : color.includes('success')
                      ? 'linear-gradient(90deg, hsl(142 76% 45%), hsl(170 76% 45%))'
                      : 'linear-gradient(90deg, hsl(38 92% 50%), hsl(45 92% 50%))'
              }}
            />
          </div>
          <span className="text-sm font-medium w-12 text-right">{value}%</span>
        </div>
      </div>
    </div>
  );
}

export function SystemCharts() {
  const [data, setData] = useState<SystemData[]>(generateInitialData);
  const [currentMetrics, setCurrentMetrics] = useState({
    cpu: 45,
    ram: 62,
    disk: 38,
    network: 25
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => {
        const newTime = new Date();
        const newEntry: SystemData = {
          time: newTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: Math.min(100, Math.max(10, prevData[prevData.length - 1].cpu + (Math.random() - 0.5) * 15)),
          ram: Math.min(100, Math.max(30, prevData[prevData.length - 1].ram + (Math.random() - 0.5) * 8)),
          disk: Math.min(100, Math.max(20, prevData[prevData.length - 1].disk + (Math.random() - 0.5) * 3)),
          network: Math.min(100, Math.max(5, prevData[prevData.length - 1].network + (Math.random() - 0.5) * 20)),
        };
        
        setCurrentMetrics({
          cpu: Math.round(newEntry.cpu),
          ram: Math.round(newEntry.ram),
          disk: Math.round(newEntry.disk),
          network: Math.round(newEntry.network)
        });

        return [...prevData.slice(1), newEntry];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          icon={Cpu} 
          label="CPU" 
          value={currentMetrics.cpu}
          color="text-primary"
          bgColor="bg-primary/20"
        />
        <MetricCard 
          icon={MemoryStick} 
          label="RAM" 
          value={currentMetrics.ram}
          color="text-accent"
          bgColor="bg-accent/20"
        />
        <MetricCard 
          icon={HardDrive} 
          label="Disco" 
          value={currentMetrics.disk}
          color="text-success"
          bgColor="bg-success/20"
        />
        <MetricCard 
          icon={Wifi} 
          label="Rede" 
          value={currentMetrics.network}
          color="text-warning"
          bgColor="bg-warning/20"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/20">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Uso de CPU</h3>
              <p className="text-xs text-muted-foreground">Últimos 60 segundos</p>
            </div>
            <div className="ml-auto text-right">
              <span className="text-2xl font-display font-bold text-primary">{currentMetrics.cpu}%</span>
            </div>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(174 100% 50%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(174 100% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(220 30% 18%)" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(220 15% 55%)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="hsl(220 15% 55%)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="hsl(174 100% 50%)" 
                  strokeWidth={2}
                  fill="url(#cpuGradient)"
                  animationDuration={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RAM Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-accent/20">
              <MemoryStick className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Uso de RAM</h3>
              <p className="text-xs text-muted-foreground">4.96 GB / 8 GB</p>
            </div>
            <div className="ml-auto text-right">
              <span className="text-2xl font-display font-bold text-accent">{currentMetrics.ram}%</span>
            </div>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(280 100% 60%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(280 100% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(220 30% 18%)" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(220 15% 55%)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="hsl(220 15% 55%)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="ram" 
                  stroke="hsl(280 100% 60%)" 
                  strokeWidth={2}
                  fill="url(#ramGradient)"
                  animationDuration={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
