"use client";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
}

export function MetricCard({ label, value, unit, icon }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-blue-900/30 bg-gray-900/50 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wide">
          {label}
        </span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-blue-400 glow">
          {value}
        </span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
    </div>
  );
}