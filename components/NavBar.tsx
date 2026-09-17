"use client";

import { Language } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavBarProps {
  lang: Language;
  onLanguageToggle: () => void;
}

export function NavBar({ lang, onLanguageToggle }: NavBarProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav className="border-b border-blue-900/30 bg-gray-950/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="text-xl font-bold text-blue-400 glow">
                Jev Lab
              </span>
            </Link>
            {!isHome && (
              <Link
                href="/"
                className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
              >
                {lang === "he" ? "בית" : "Home"}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onLanguageToggle}
              className="rounded-lg bg-blue-900/30 px-4 py-2 text-sm font-medium text-blue-300 hover:bg-blue-900/50 transition-colors"
            >
              {lang === "he" ? "EN" : "עב"}
            </button>
            <a
              href="https://docs.typesafe.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
            >
              {lang === "he" ? "מסמכים" : "Docs"}
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}