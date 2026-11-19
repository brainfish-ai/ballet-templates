const { deal_name, handoff_summary } = input_data as { deal_name: string; handoff_summary: string };

// Create Slack channel with normalized name
const channelName = `cs-${deal_name.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 70)}`;

const createResult = await metaphor.integration('slack_bot', 'channels.create', {
  name: channelName,
  isPrivate: false,
});

if (!createResult.ok) {
  throw new Error(`Failed to create Slack channel: ${createResult.error?.message ?? JSON.stringify(createResult.error)}`);
}

const channel_id = createResult.data?.channel?.id || createResult.data?.id;

// Post handoff summary to channel
const messageResult = await metaphor.integration('slack_bot', 'messages.send', {
  channel: channel_id,
  text: `*CS Handoff Summary*\n\n${handoff_summary}`,
});

if (!messageResult.ok) {
  throw new Error(`Failed to post message: ${messageResult.error?.message ?? JSON.stringify(messageResult.error)}`);
}

const result = { channel_id, channel_name: channelName };
