const { digest_text, slack_channel } = input_data as {
  digest_text: string;
  slack_channel: string;
};

const slackResult = metaphor.integration('slack_bot', 'messages.send', {
  channel: slack_channel,
  text: digest_text,
});

if (!slackResult.ok) {
  throw new Error(`Failed to send Slack message: ${slackResult.error}`);
}

const result = {
  sent: true,
  channel: slack_channel,
  ts: slackResult.data?.ts,
};
