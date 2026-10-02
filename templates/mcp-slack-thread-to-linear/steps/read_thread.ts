const { channel_id, thread_ts } = input_data as { channel_id: string; thread_ts: string };

const thread = await metaphor.mcp('slack', 'slack_read_thread', {
  channel_id,
  message_ts: thread_ts,
});

const result = { thread };
