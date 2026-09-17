"use client";

interface ProbabilityChartProps {
  probabilities: Record<string, number>;
  selected?: string;
}

export function ProbabilityChart({ probabilities, selected }: ProbabilityChartProps) {
  const entries = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  const maxValue = Math.max(...entries.map(([_, v]) => v));

  return (
    <div className="space-y-3">
      {entries.map(([option, prob]) => {
        const percentage = Math.round(prob * 100);
        const width = maxValue > 0 ? (prob / maxValue) * 100 : 0;
        const isSelected = option === selected;

        return (
          <div key={option} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${isSelected ? "text-blue-400 glow" : "text-gray-300"}`}>
                {option}
                {isSelected && " ✓"}
              </span>
              <span className="font-mono text-gray-500">{percentage}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-800">
              <div
                className={`h-full transition-all duration-500 ${
                  isSelected ? "bg-blue-500 pulse-glow" : "bg-blue-700/50"
                }`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}