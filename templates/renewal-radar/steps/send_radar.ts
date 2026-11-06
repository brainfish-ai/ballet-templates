const { recipients, subject, body } = input_data as { recipients?: string; subject: string; body: string };

function check<T>(res: { ok: boolean; data?: T; error?: { message?: string } }, what: string): T {
  if (!res.ok) {
    throw new Error(`${what} failed: ${res.error?.message ?? 'unknown error'}. Check the Gmail connection and try again.`);
  }
  return res.data as T;
}

let to = String(recipients ?? '')
  .split(/[\s,;]+/)
  .map(s => s.trim())
  .filter(s => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s));

if (to.length === 0) {
  const me = check<{ emailAddress?: string }>(await metaphor.integration('gmail', 'me.get', {}), 'Reading your Gmail address');
  if (!me.emailAddress) throw new Error('Could not find your Gmail address. Set the recipients input instead.');
  to = [me.emailAddress];
}

check(
  await metaphor.integration('gmail', 'messages.send', {
    to,
    subject: String(subject || 'Renewal radar').replace(/[\r\n]+/g, ' ').slice(0, 200),
    body,
    contentType: 'text',
  }),
  'Sending the radar',
);

const result = { sent_to: to, subject };
