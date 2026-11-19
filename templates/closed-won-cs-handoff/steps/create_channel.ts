const { deal_name, handoff_summary } = input_data as { deal_name: string; handoff_summary: string };

const slackToken = metaphor.secret('SLACK_BOT_TOKEN');

// Create Slack channel with normalized name
const channelName = `cs-${deal_name.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 70)}`;

const createRes = await fetch('https://slack.com/api/conversations.create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${slackToken}`,
  },
  body: JSON.stringify({
    name: channelName,
    is_private: false,
  }),
});

if (!createRes.ok) {
  throw new Error(`Slack API error: ${createRes.status} ${createRes.statusText}`);
}

const createData = await createRes.json() as { ok: boolean; channel: { id: string } };

if (!createData.ok) {
  throw new Error('Failed to create Slack channel');
}

const channel_id = createData.channel.id;

// Post handoff summary to channel
await fetch('https://slack.com/api/chat.postMessage', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${slackToken}`,
  },
  body: JSON.stringify({
    channel: channel_id,
    text: `*CS Handoff Summary*\n\n${handoff_summary}`,
  }),
});

const result = { channel_id, channel_name: channelName };
