'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const REFRESH_SECONDS = 10;

export function AutoRefresh({ generatedAt }: { generatedAt: string }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(REFRESH_SECONDS);

  useEffect(() => {
    const countdown = window.setInterval(() => {
      setRemaining((current) => (current <= 1 ? REFRESH_SECONDS : current - 1));
    }, 1_000);
    const refresh = window.setInterval(() => router.refresh(), REFRESH_SECONDS * 1_000);
    return () => {
      window.clearInterval(countdown);
      window.clearInterval(refresh);
    };
  }, [generatedAt, router]);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <span className="hidden sm:inline">{new Date(generatedAt).toLocaleTimeString('pt-BR')}</span>
      <span className="rounded-full border border-white/8 bg-white/5 px-3 py-2">Atualiza em {remaining}s</span>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
      >
        Atualizar
      </button>
    </div>
  );
}
