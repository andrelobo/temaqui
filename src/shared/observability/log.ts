type LogLevel = 'info' | 'warn' | 'error';

export const logEvent = (
  level: LogLevel,
  event: string,
  context: Record<string, unknown> = {},
): void => {
  const entry = JSON.stringify({ event, ...context });
  console[level](entry);
};
