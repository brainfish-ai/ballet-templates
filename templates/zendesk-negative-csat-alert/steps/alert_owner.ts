const { slack_message, slack_channel, owner_email } = input_data as {
  slack_message: string;
  slack_channel: string;
  owner_email?: string | null;
};

let mention_text = '';

// Try to mention the owner if we have their email
if (owner_email) {
  const userLookupResult = await metaphor.integration('slack_bot', 'users.findByEmail', {
    email: owner_email,
  });
  
  if (userLookupResult.ok && userLookupResult.data?.user?.id) {
    mention_text = `<@${userLookupResult.data.user.id}> `;
  }
}

const finalMessage = mention_text + slack_message;

const slackResult = await metaphor.integration('slack_bot', 'messages.send', {
  channel: slack_channel,
  text: finalMessage,
});

if (!slackResult.ok) {
  throw new Error(`Failed to send Slack message: ${slackResult.error?.message ?? JSON.stringify(slackResult.error)}`);
}

const result = {
  sent: true,
  channel: slack_channel,
  ts: slackResult.data?.ts,
};
