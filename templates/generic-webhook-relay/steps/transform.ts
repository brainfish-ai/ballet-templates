const { payload } = input_data as { payload: Record<string, unknown> };

const result = {
  event: payload?.type ?? 'unknown',
  receivedAt: new Date().toISOString(),
  data: payload,
};
