const { channel_id, cs_team_emails } = input_data as { channel_id: string; cs_team_emails: string[] };

let result;

if (!cs_team_emails || cs_team_emails.length === 0) {
  result = { message: 'No CS team members to invite' };
} else {
  // Look up Slack user IDs by email
  const userIds: string[] = [];
  for (const email of cs_team_emails) {
    const lookupResult = await metaphor.integration('slack_bot', 'users.findByEmail', {
      email,
    });
    
    if (lookupResult.ok && lookupResult.data?.user?.id) {
      userIds.push(lookupResult.data.user.id);
    }
  }

  // Invite users to channel
  if (userIds.length > 0) {
    const inviteResult = await metaphor.integration('slack_bot', 'channels.invite', {
      channel: channel_id,
      users: userIds,
    });

    if (!inviteResult.ok) {
      throw new Error(`Failed to invite users: ${inviteResult.error?.message ?? JSON.stringify(inviteResult.error)}`);
    }
  }

  result = { invited_count: userIds.length };
}
