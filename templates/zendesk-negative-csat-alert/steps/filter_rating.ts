// Read from native Zendesk webhook payload
const webhook = (input_data as any).event || input_data;
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

let result;

if (!is_negative) {
  result = {
    skipped: true,
    is_negative: false,
    rating_score,
  };
} else {
  result = { 
    is_negative, 
    rating_score, 
    rating_comment,
    ticket_id,
    requester_email,
  };
}
