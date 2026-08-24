import { notFound } from 'next/navigation';
import { getOperationsDashboardData } from '@/modules/operations/operations-dashboard';
import { AutoRefresh } from './auto-refresh';

export const dynamic = 'force-dynamic';

const intentMeta: Record<string, { label: string; classes: string; dot: string }> = {
  DEMAND: { label: 'Demanda', classes: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300', dot: 'bg-cyan-300' },
  SUPPLY: { label: 'Oferta', classes: 'border-lime-400/20 bg-lime-400/10 text-lime-300', dot: 'bg-lime-300' },
  REPEATED_PROMOTION: { label: 'Repetição', classes: 'border-amber-400/20 bg-amber-400/10 text-amber-300', dot: 'bg-amber-300' },
  IRRELEVANT: { label: 'Sem sinal', classes: 'border-white/10 bg-white/5 text-slate-400', dot: 'bg-slate-500' },
  LEGACY: { label: 'Legado', classes: 'border-violet-400/20 bg-violet-400/10 text-violet-300', dot: 'bg-violet-300' },
};

const signalLabels: Record<string, string> = {
  availability: 'Disponibilidade', delivery: 'Entrega', menu: 'Cardápio',
  need: 'Necessidade', offering: 'Serviço', payment: 'Pagamento', price: 'Preço',
  promotion: 'Promoção', recommendation: 'Recomendação', search: 'Busca',
  selling: 'Venda', where_to_buy: 'Onde comprar', who_provides: 'Fornecedor',
};

type IconName = 'pulse' | 'database' | 'clock' | 'shield' | 'repeat' | 'spark';

function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, string> = {
    pulse: 'M3 12h4l2-6 4 12 2-6h6',
    database: 'M4 6c0 2 16 2 16 0s-16-2-16 0Zm0 0v12c0 2 16 2 16 0V6M4 12c0 2 16 2 16 0',
    clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    shield: 'M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6l-7-3Z',
    repeat: 'm17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3',
    spark: 'm12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Z',
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={paths[name]} />
    </svg>
  );
}

const accentClasses = {
  lime: 'from-lime-300/20 text-lime-300 ring-lime-300/20',
  cyan: 'from-cyan-300/20 text-cyan-300 ring-cyan-300/20',
  violet: 'from-violet-300/20 text-violet-300 ring-violet-300/20',
};

function MetricCard({ label, value, detail, icon, accent }: {
  label: string; value: number | string; detail: string; icon: IconName;
  accent: keyof typeof accentClasses;
}) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.045] p-5 shadow-2xl shadow-black/10 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/15">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accentClasses[accent]} to-transparent`} />
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <span className={`rounded-xl bg-white/5 p-2 ring-1 ${accentClasses[accent]}`}><Icon name={icon} /></span>
      </div>
      <p className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function DistributionBar({ label, value, total, color }: {
  label: string; value: number; total: number; color: string;
}) {
  const percentage = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono text-slate-500">{value}<span className="ml-2 text-slate-600">{percentage}%</span></span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default async function OperationsPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  const data = await getOperationsDashboardData();
  const total = data.audit.classified.total + data.audit.noise.total + data.repeatedPromotions;

  return (
    <main className="ops-surface min-h-screen overflow-hidden bg-[#070b12] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-lime-400/8 blur-[120px]" />
        <div className="absolute -right-40 top-20 h-[30rem] w-[30rem] rounded-full bg-cyan-400/8 blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-[1440px] px-4 py-5 sm:px-7 lg:px-10 lg:py-8">
        <header className="flex flex-col gap-6 border-b border-white/8 pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-lime-300 text-[#09100b] shadow-[0_0_40px_rgba(190,242,100,0.2)]">
              <Icon name="pulse" className="h-7 w-7" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#070b12] bg-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold tracking-tight">TemAqui</h1>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Intelligence</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Radar econômico hiperlocal</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-full border border-lime-300/15 bg-lime-300/5 px-3 py-2 text-xs font-medium text-lime-300">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-300 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-lime-300" /></span>
              Coleta ao vivo
            </div>
            <AutoRefresh generatedAt={data.generatedAt} />
          </div>
        </header>

        <section className="grid gap-8 py-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-lime-300"><Icon name="spark" className="h-4 w-4" />Pulso da comunidade</div>
            <h2 className="max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              O que o bairro precisa,
              <span className="block bg-gradient-to-r from-lime-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">antes que desapareça no chat.</span>
            </h2>
          </div>
          <div className="max-w-sm rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-sm leading-6 text-slate-400"><span className="font-medium text-slate-200">Privacidade por padrão.</span> Nenhum texto, telefone ou identidade pessoal aparece nesta visão.</div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Gateway" value={data.gateway.online ? 'Online' : 'Offline'} detail="WhatsApp conectado e recebendo eventos" icon="pulse" accent="lime" />
          <MetricCard label="Sinais armazenados" value={data.totalEvents} detail="Eventos autorizados no MongoDB Atlas" icon="database" accent="cyan" />
          <MetricCard label="Janela de 5 horas" value={data.eventsLastFiveHours} detail="Atividade recente da comunidade" icon="clock" accent="violet" />
          <MetricCard label="Dados protegidos" value={data.redactedEvents} detail="Eventos anonimizados antes da análise" icon="shield" accent="lime" />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-3xl border border-white/8 bg-white/[0.035] p-6 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Leitura da amostra</p><h3 className="mt-2 text-xl font-semibold">Intenção econômica</h3></div>
              <span className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-400">{total} analisados</span>
            </div>
            <div className="mt-8 space-y-6">
              <DistributionBar label="Ofertas" value={data.audit.classified.byIntent.SUPPLY} total={total} color="from-lime-300 to-emerald-400" />
              <DistributionBar label="Demandas" value={data.audit.classified.byIntent.DEMAND} total={total} color="from-cyan-300 to-blue-400" />
              <DistributionBar label="Promoções repetidas" value={data.repeatedPromotions} total={total} color="from-amber-300 to-orange-400" />
              <DistributionBar label="Sem sinal econômico" value={data.audit.classified.byIntent.IRRELEVANT} total={total} color="from-slate-500 to-slate-600" />
              <DistributionBar label="Ruído detectado" value={data.audit.noise.total} total={total} color="from-violet-400 to-fuchsia-400" />
            </div>
          </article>

          <article className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-[#111923] to-[#0a0f17] p-6 shadow-2xl shadow-black/10 sm:p-7">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-300/8 blur-3xl" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Sinais em evidência</p>
              <h3 className="mt-2 text-xl font-semibold">O que movimenta o bairro</h3>
              <div className="mt-7 flex flex-wrap gap-2.5">
                {Object.entries(data.audit.classified.bySignal).length === 0 ? <p className="text-sm text-slate-500">Aguardando sinais econômicos.</p> :
                  Object.entries(data.audit.classified.bySignal).sort(([, a], [, b]) => b - a).map(([signal, count], index) => (
                    <span key={signal} className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium ${index === 0 ? 'border-lime-300/20 bg-lime-300/10 text-lime-200' : 'border-white/8 bg-white/5 text-slate-300'}`}>
                      {signalLabels[signal] ?? signal}<span className="font-mono text-xs opacity-55">{count}</span>
                    </span>
                  ))}
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/8 bg-black/15 p-4"><Icon name="repeat" className="h-5 w-5 text-amber-300" /><p className="mt-4 text-2xl font-semibold">{data.repeatedPromotions}</p><p className="mt-1 text-xs text-slate-500">repetições contidas</p></div>
                <div className="rounded-2xl border border-white/8 bg-black/15 p-4"><Icon name="shield" className="h-5 w-5 text-cyan-300" /><p className="mt-4 text-2xl font-semibold">100%</p><p className="mt-1 text-xs text-slate-500">visão anonimizada</p></div>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-5 overflow-hidden rounded-3xl border border-white/8 bg-white/[0.035] shadow-2xl shadow-black/10 backdrop-blur-xl">
          <div className="flex flex-col gap-2 border-b border-white/8 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Event stream</p><h3 className="mt-1 text-xl font-semibold">Atividade recente</h3></div>
            <p className="text-xs text-slate-500">Últimos 20 eventos · somente metadados</p>
          </div>
          <div className="divide-y divide-white/6">
            {data.recentEvents.map((event) => {
              const meta = intentMeta[event.intent] ?? intentMeta.LEGACY;
              return (
                <article key={event.id} className="grid gap-4 px-6 py-5 transition hover:bg-white/[0.025] sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-7">
                  <div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full shadow-[0_0_14px_currentColor] ${meta.dot}`} /><div><p className="font-mono text-sm text-slate-300">{new Date(event.receivedAt).toLocaleTimeString('pt-BR')}</p><p className="mt-1 text-xs text-slate-600">{new Date(event.receivedAt).toLocaleDateString('pt-BR')}</p></div></div>
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${meta.classes}`}>{meta.label}</span><span className="text-xs text-slate-600">{event.status}</span></div><p className="mt-2 truncate text-sm text-slate-400">{event.signals.length > 0 ? event.signals.map((signal) => signalLabels[signal] ?? signal).join(' · ') : 'Nenhum sinal adicional'}</p></div>
                  <div className="text-left sm:text-right"><p className="max-w-xs truncate text-xs text-slate-500">{event.messageType}</p><p className="mt-1 text-xs text-slate-600">{event.fromMe ? 'Sessão própria' : 'Comunidade'}</p></div>
                </article>
              );
            })}
            {data.recentEvents.length === 0 && <div className="px-6 py-16 text-center text-sm text-slate-500">Aguardando atividade da comunidade.</div>}
          </div>
        </section>
        <footer className="flex flex-col gap-3 py-8 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between"><p>TemAqui · inteligência hiperlocal com privacidade</p><p>Ambiente local de demonstração</p></footer>
      </div>
    </main>
  );
}
