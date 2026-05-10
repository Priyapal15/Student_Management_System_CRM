import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  change?: string;
}

export function StatCard({ title, value, icon: Icon, gradient, change }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-5 stat-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {change && (
            <p className="text-xs text-success font-medium mt-1">{change}</p>
          )}
        </div>
        <div className={`${gradient} w-11 h-11 rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>
    </motion.div>
  );
}
