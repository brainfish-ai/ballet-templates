const { channel_id, cs_team_emails } = input_data as { channel_id: string; cs_team_emails: string[] };

if (!cs_team_emails || cs_team_emails.length === 0) {
  const result = { message: 'No CS team members to invite' };
  return;
}

// Look up Slack user IDs by email
const userIds: string[] = [];
for (const email of cs_team_emails) {
  const lookupResult = metaphor.integration('slack_bot', 'users.findByEmail', {
    email,
  });
  
  if (lookupResult.ok && lookupResult.data?.id) {
    userIds.push(lookupResult.data.id);
  }
}

// Invite users to channel
if (userIds.length > 0) {
  const inviteResult = metaphor.integration('slack_bot', 'channels.invite', {
    channel: channel_id,
    users: userIds,
  });

  if (!inviteResult.ok) {
    throw new Error(`Failed to invite users: ${inviteResult.error}`);
  }
}

const result = { invited_count: userIds.length };
