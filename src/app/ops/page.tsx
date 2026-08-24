import { notFound } from 'next/navigation';
import { getOperationsDashboardData } from '@/modules/operations/operations-dashboard';
import { AutoRefresh } from './auto-refresh';

export const dynamic = 'force-dynamic';

const intentStyles: Record<string, string> = {
  DEMAND: 'bg-sky-100 text-sky-800',
  SUPPLY: 'bg-emerald-100 text-emerald-800',
  IRRELEVANT: 'bg-slate-200 text-slate-700',
  LEGACY: 'bg-amber-100 text-amber-800',
};

const Metric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
  </div>
);

export default async function OperationsPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  const data = await getOperationsDashboardData();

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
              TemAqui Ops
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Coleta e classificação
            </h1>
            <p className="mt-2 text-slate-600">
              Painel local e privativo. Nenhum texto ou identificador pessoal é exibido.
            </p>
          </div>
          <AutoRefresh generatedAt={data.generatedAt} />
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Gateway" value={data.gateway.online ? 'Online' : 'Offline'} />
          <Metric label="Eventos armazenados" value={data.totalEvents} />
          <Metric label="Últimas 5 horas" value={data.eventsLastFiveHours} />
          <Metric label="Amostra auditada" value={data.audit.sampled} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Distribuição da amostra</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Demandas" value={data.audit.classified.byIntent.DEMAND} />
              <Metric label="Ofertas" value={data.audit.classified.byIntent.SUPPLY} />
              <Metric label="Irrelevantes" value={data.audit.classified.byIntent.IRRELEVANT} />
              <Metric label="Ruído detectável" value={data.audit.noise.total} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Sinais acionados</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {Object.entries(data.audit.classified.bySignal).length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum sinal econômico na amostra atual.</p>
              ) : (
                Object.entries(data.audit.classified.bySignal).map(([signal, count]) => (
                  <span
                    key={signal}
                    className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-800"
                  >
                    {signal}: {count}
                  </span>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold">Atividade persistida recente</h2>
            <p className="mt-1 text-sm text-slate-500">Somente metadados dos últimos 20 eventos.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-3xl text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Horário</th>
                  <th className="px-6 py-3 font-medium">Intenção</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium">Origem</th>
                  <th className="px-6 py-3 font-medium">Sinais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {new Date(event.receivedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${intentStyles[event.intent] ?? intentStyles.LEGACY}`}
                      >
                        {event.intent}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{event.status}</td>
                    <td className="px-6 py-4 text-slate-600">{event.messageType}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {event.fromMe ? 'própria sessão' : 'grupo'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {event.signals.join(', ') || '—'}
                    </td>
                  </tr>
                ))}
                {data.recentEvents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                      Ainda não há eventos persistidos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
