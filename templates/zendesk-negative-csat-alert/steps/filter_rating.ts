const { rating_score, rating_comment } = input_data as {
  rating_score: string;
  rating_comment?: string;
};

const negative_scores = ['bad', 'offered'];

const is_negative = negative_scores.includes(rating_score.toLowerCase()) ||
  (rating_score.toLowerCase() === 'good' && rating_comment && rating_comment.trim().length > 0);

if (!is_negative) {
  throw new Error(`Rating score "${rating_score}" is not negative. Exiting workflow.`);
}

const result = { is_negative, rating_score };
