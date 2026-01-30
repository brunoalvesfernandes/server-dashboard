import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  trend,
  variant = 'default',
  className 
}: StatsCardProps) {
  return (
    <div className={cn(
      "glass-card p-6 glow-border transition-all duration-300 hover:scale-[1.02]",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className={cn(
              "text-3xl font-display font-bold",
              variant === 'primary' && "text-gradient-primary",
              variant === 'success' && "text-success",
              variant === 'warning' && "text-warning",
              variant === 'destructive' && "text-destructive",
              variant === 'default' && "text-foreground"
            )}>
              {value}
            </h3>
            {trend && (
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded",
                trend.isPositive 
                  ? "text-success bg-success/20"
                  : "text-destructive bg-destructive/20"
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        
        <div className={cn(
          "p-3 rounded-xl transition-all duration-300",
          variant === 'primary' && "bg-primary/20 text-primary",
          variant === 'success' && "bg-success/20 text-success",
          variant === 'warning' && "bg-warning/20 text-warning",
          variant === 'destructive' && "bg-destructive/20 text-destructive",
          variant === 'default' && "bg-muted text-muted-foreground"
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
