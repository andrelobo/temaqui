import { createClassificationAudit } from '@/modules/classification/classification-audit';
import { IngestionEventModel } from '@/modules/ingestion/ingestion-event.model';
import { connectMongo } from '@/shared/db/mongoose';

interface RecentEvent {
  id: string;
  receivedAt: string;
  intent: string;
  status: string;
  messageType: string;
  fromMe: boolean;
  signals: string[];
}

export interface OperationsDashboardData {
  generatedAt: string;
  gateway: { online: boolean; status: string };
  totalEvents: number;
  eventsLastFiveHours: number;
  repeatedPromotions: number;
  redactedEvents: number;
  audit: ReturnType<typeof createClassificationAudit>;
  recentEvents: RecentEvent[];
}

const getGatewayStatus = async (): Promise<OperationsDashboardData['gateway']> => {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/health', {
      cache: 'no-store',
      signal: AbortSignal.timeout(2_000),
    });
    if (!response.ok) return { online: false, status: `HTTP ${response.status}` };
    const body = (await response.json()) as { status?: string };
    return { online: body.status === 'ok', status: body.status ?? 'unknown' };
  } catch {
    return { online: false, status: 'offline' };
  }
};

export const getOperationsDashboardData = async (): Promise<OperationsDashboardData> => {
  await connectMongo();
  const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1_000);
  const [
    gateway,
    totalEvents,
    eventsLastFiveHours,
    repeatedPromotions,
    redactedEvents,
    auditEvents,
    recentEvents,
  ] = await Promise.all([
    getGatewayStatus(),
    IngestionEventModel.countDocuments({}).exec(),
    IngestionEventModel.countDocuments({ receivedAt: { $gte: fiveHoursAgo } }).exec(),
    IngestionEventModel.countDocuments({ economicIntent: 'REPEATED_PROMOTION' }).exec(),
    IngestionEventModel.countDocuments({ 'redactionTypes.0': { $exists: true } }).exec(),
    IngestionEventModel.find({ body: { $type: 'string', $ne: '' } })
      .sort({ receivedAt: -1 })
      .limit(1_000)
      .select({ _id: 0, body: 1 })
      .lean()
      .exec(),
    IngestionEventModel.find({})
      .sort({ receivedAt: -1 })
      .limit(20)
      .select({
        receivedAt: 1,
        economicIntent: 1,
        processingStatus: 1,
        messageType: 1,
        fromMe: 1,
        classificationSignals: 1,
      })
      .lean()
      .exec(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    gateway,
    totalEvents,
    eventsLastFiveHours,
    repeatedPromotions,
    redactedEvents,
    audit: createClassificationAudit(auditEvents.map(({ body }) => body)),
    recentEvents: recentEvents.map((event) => ({
      id: String(event._id),
      receivedAt: event.receivedAt.toISOString(),
      intent: event.economicIntent ?? 'LEGACY',
      status: event.processingStatus,
      messageType: event.messageType,
      fromMe: event.fromMe,
      signals: event.classificationSignals ?? [],
    })),
  };
};
