const { channel_id, cs_team_emails } = input_data as { channel_id: string; cs_team_emails: string[] };

if (!cs_team_emails || cs_team_emails.length === 0) {
  const result = { message: 'No CS team members to invite' };
  return;
}

const slackToken = metaphor.secret('SLACK_BOT_TOKEN');

// Look up Slack user IDs by email
const userIds: string[] = [];
for (const email of cs_team_emails) {
  const lookupRes = await fetch(`https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(email)}`, {
    headers: {
      'Authorization': `Bearer ${slackToken}`,
    },
  });
  
  if (lookupRes.ok) {
    const lookupData = await lookupRes.json() as { ok: boolean; user?: { id: string } };
    if (lookupData.ok && lookupData.user) {
      userIds.push(lookupData.user.id);
    }
  }
}

// Invite users to channel
if (userIds.length > 0) {
  await fetch('https://slack.com/api/conversations.invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${slackToken}`,
    },
    body: JSON.stringify({
      channel: channel_id,
      users: userIds.join(','),
    }),
  });
}

const result = { invited_count: userIds.length };
