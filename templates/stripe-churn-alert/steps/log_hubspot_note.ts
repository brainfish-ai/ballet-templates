const { contact_id, company_id, churn_summary, subscription_end, skipped } = input_data as {
  contact_id?: string | null;
  company_id?: string | null;
  churn_summary?: string;
  subscription_end?: string;
  skipped?: boolean;
};

if (skipped) {
  const result = { skipped: true };
  return;
}

if (!contact_id && !company_id) {
  const result = { logged: false, message: 'No HubSpot contact or company found. Skipping note.' };
  return;
}

const note_body = `Stripe Subscription Cancelled\n\n${churn_summary}\n\nSubscription ends: ${subscription_end}\n\nLogged automatically by Ballet.`;

const target_id = contact_id || company_id;
const target_type = contact_id ? 'contacts' : 'companies';

// Create note with association - using api.get for note creation as it's not in the standard actions
const noteResult = metaphor.integration('hubspot', 'api.get', {
  path: '/crm/v3/objects/notes',
  method: 'POST',
  body: {
    properties: {
      hs_note_body: note_body,
      hs_timestamp: new Date().toISOString(),
    },
    associations: [{
      to: { id: target_id },
      types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: target_type === 'contacts' ? 202 : 190 }],
    }],
  },
});

if (!noteResult.ok) {
  throw new Error(`HubSpot note creation failed: ${noteResult.error}`);
}

const result = { logged: true, target_type, target_id };
