export function appLog(
  event: string,
  data: Record<string, unknown> = {},
  level: 'info' | 'error' = 'info',
) {
  const payload = JSON.stringify({
    event,
    ts: new Date().toISOString(),
    ...data,
  });
  if (level === 'error') {
    console.error(payload);
  } else {
    console.log(payload);
  }
}
