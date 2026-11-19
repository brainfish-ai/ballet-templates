const { contact_id, company_id, churn_summary, subscription_end } = input_data as {
  contact_id?: string | null;
  company_id?: string | null;
  churn_summary: string;
  subscription_end: string;
};

if (!contact_id && !company_id) {
  const result = { logged: false, message: 'No HubSpot contact or company found. Skipping note.' };
  return;
}

const hubspotToken = metaphor.secret('HUBSPOT_ACCESS_TOKEN');

const note_body = `Stripe Subscription Cancelled\n\n${churn_summary}\n\nSubscription ends: ${subscription_end}\n\nLogged automatically by Ballet.`;

const target_id = contact_id ?? company_id;
const target_type = contact_id ? 'contacts' : 'companies';

const noteRes = await fetch(`https://api.hubapi.com/crm/v3/objects/notes`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${hubspotToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    properties: {
      hs_note_body: note_body,
      hs_timestamp: new Date().toISOString(),
    },
    associations: [{
      to: { id: target_id },
      types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: target_type === 'contacts' ? 202 : 190 }],
    }],
  }),
});

if (!noteRes.ok) {
  const errorText = await noteRes.text();
  throw new Error(`HubSpot note creation failed: ${noteRes.status} ${errorText}`);
}

const result = { logged: true, target_type, target_id };
