// Read from native Zendesk webhook payload
// Be defensive: satisfaction_rating may be in flow.input.ticket.satisfaction_rating or flow.input.raw
const webhook = input_data as any;
const ticket = webhook.ticket || {};
const raw = webhook.raw || {};

// Try to find satisfaction_rating in various locations
const satisfaction_rating = ticket.satisfaction_rating || raw.satisfaction_rating || raw.data?.satisfaction_rating || {};

const rating_score = satisfaction_rating.score || '';
const rating_comment = satisfaction_rating.comment || '';
const ticket_id = ticket.id || raw.ticket_id || '';
const requester_email = ticket.requester?.email || raw.requester?.email || '';

const negative_scores = ['bad'];

const is_negative = negative_scores.includes(rating_score.toLowerCase());

if (!is_negative) {
  throw new Error(`Rating score "${rating_score}" is not negative. Exiting workflow.`);
}

const result = { 
  is_negative, 
  rating_score, 
  rating_comment,
  ticket_id,
  requester_email,
};
