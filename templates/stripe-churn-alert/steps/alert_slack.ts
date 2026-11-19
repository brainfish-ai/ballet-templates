const { slack_message, slack_channel, skipped } = input_data as {
  slack_message?: string;
  slack_channel?: string;
  skipped?: boolean;
};

if (skipped) {
  const result = { skipped: true };
  return;
}

const slackResult = metaphor.integration('slack_bot', 'messages.send', {
  channel: slack_channel,
  text: slack_message,
});

if (!slackResult.ok) {
  throw new Error(`Failed to send Slack message: ${slackResult.error}`);
}

const result = {
  sent: true,
  channel: slack_channel,
  ts: slackResult.data?.ts,
};
