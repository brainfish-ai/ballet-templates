const { name, email, company, message } = input_data as {
  name?: string;
  email: string;
  company?: string;
  message?: string;
};

const res = await metaphor.agent('lead-scorer', {
  prompt: `Name: ${name ?? 'unknown'}\nEmail: ${email}\nCompany: ${company ?? 'unknown'}\nMessage: ${message ?? ''}`,
});

const score = Math.max(0, Math.min(10, Number(res?.score ?? 0)));
const reason = String(res?.reason ?? '').slice(0, 300);
const hot = score >= 7;

const label = hot ? ':fire: Hot lead' : 'New lead';
const slack_text = `${label} (${score}/10): ${name ?? email}${company ? ` at ${company}` : ''}\n${reason}\n${email}`;

const result = { score, reason, hot, slack_text };
