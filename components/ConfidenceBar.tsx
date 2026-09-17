"use client";

interface ConfidenceBarProps {
  value: number;
  label?: string;
  threshold?: number;
}

export function ConfidenceBar({ value, label, threshold = 0.75 }: ConfidenceBarProps) {
  const percentage = Math.round(value * 100);
  const color = value >= threshold ? "bg-green-500" : value >= 0.5 ? "bg-yellow-500" : "bg-red-500";
  
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">{label}</span>
          <span className="font-mono text-blue-400">{percentage}%</span>
        </div>
      )}
      <div className="h-3 overflow-hidden rounded-full bg-gray-800">
        <div
          className={`confidence-bar h-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {threshold && (
        <div className="relative h-1">
          <div
            className="absolute top-0 h-4 w-px bg-gray-600"
            style={{ left: `${threshold * 100}%` }}
          >
            <span className="absolute -top-1 left-1 text-xs text-gray-500">
              {Math.round(threshold * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}