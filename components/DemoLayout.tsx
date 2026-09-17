"use client";

import { ReactNode } from "react";
import { Language, t } from "@/lib/i18n";
import { MetricCard } from "./MetricCard";

interface DemoLayoutProps {
  lang: Language;
  title: string;
  description: string;
  children: ReactNode;
  results?: ReactNode;
  metrics?: {
    latency?: number;
    tokens?: number;
  };
  whyItMatters: string;
}

export function DemoLayout({
  lang,
  title,
  description,
  children,
  results,
  metrics,
  whyItMatters,
}: DemoLayoutProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-blue-400 glow">{title}</h1>
        <p className="text-gray-400">{description}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-blue-900/30 bg-gray-900/50 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 text-blue-300">
              {t(lang, "input")}
            </h2>
            {children}
          </div>

          <div className="rounded-xl border border-yellow-900/30 bg-yellow-900/10 p-6 backdrop-blur-sm">
            <h3 className="text-sm font-bold mb-2 text-yellow-400 uppercase tracking-wide">
              {t(lang, "whyItMatters")}
            </h3>
            <p className="text-sm text-gray-300">{whyItMatters}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-blue-900/30 bg-gray-900/50 p-6 backdrop-blur-sm min-h-[400px]">
            <h2 className="text-xl font-bold mb-4 text-blue-300">
              {t(lang, "results")}
            </h2>
            {results || (
              <p className="text-gray-500 text-center mt-16">
                {t(lang, "run")}...
              </p>
            )}
          </div>

          {metrics && (
            <div className="grid gap-4 grid-cols-2">
              {metrics.latency !== undefined && (
                <MetricCard
                  label={t(lang, "latency")}
                  value={metrics.latency}
                  unit="ms"
                  icon="⚡"
                />
              )}
              {metrics.tokens !== undefined && (
                <MetricCard
                  label={t(lang, "tokens")}
                  value={metrics.tokens}
                  icon="🔢"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}