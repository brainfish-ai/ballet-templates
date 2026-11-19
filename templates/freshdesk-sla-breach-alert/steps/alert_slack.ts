const { tickets, slack_channel } = input_data as {
  tickets: Array<{ id: number; subject: string; due_by: string; responder_id: number | null; priority: number }>;
  slack_channel: string;
};

if (!tickets || tickets.length === 0) {
  const result = { message: 'No SLA breaches to alert', alerts_sent: 0 };
  return;
}

let alertsSent = 0;

for (const ticket of tickets) {
  const dueBy = new Date(ticket.due_by);
  const now = new Date();
  const hoursRemaining = Math.round((dueBy.getTime() - now.getTime()) / (1000 * 60 * 60));
  const isOverdue = hoursRemaining < 0;
  
  const priorityLabels = ['', 'Low', 'Medium', 'High', 'Urgent'];
  const priorityLabel = priorityLabels[ticket.priority] || 'Unknown';
  
  const message = isOverdue
    ? `:rotating_light: SLA BREACH: Ticket #${ticket.id} is ${Math.abs(hoursRemaining)}h overdue (${priorityLabel} priority)`
    : `:warning: SLA Warning: Ticket #${ticket.id} breaches in ${hoursRemaining}h (${priorityLabel} priority)`;
  
  const text = `${message}\n*${ticket.subject}*\nView ticket: #${ticket.id}`;
  
  const slackResult = metaphor.integration('slack_bot', 'messages.send', {
    channel: slack_channel,
    text: text,
  });
  
  if (!slackResult.ok) {
    console.warn(`Failed to post Slack alert for ticket ${ticket.id}: ${slackResult.error}`);
  } else {
    alertsSent++;
  }
}

const result = { alerts_sent: alertsSent, tickets_checked: tickets.length };
