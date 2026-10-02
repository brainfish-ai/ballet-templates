const { channel_id, text } = input_data as { channel_id: string; text: string };

const posted = await metaphor.mcp('slack', 'slack_send_message', {
  channel_id,
  message: text,
});

const result = { posted };
