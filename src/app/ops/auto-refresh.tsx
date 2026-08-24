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
    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
      <span>Atualizado às {new Date(generatedAt).toLocaleTimeString('pt-BR')}</span>
      <span>Próxima atualização em {remaining}s</span>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-700 hover:bg-slate-100"
      >
        Atualizar agora
      </button>
    </div>
  );
}
