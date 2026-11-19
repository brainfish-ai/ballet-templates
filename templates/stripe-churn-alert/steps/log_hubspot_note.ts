const { contact_id, company_id, churn_summary, subscription_end, skipped } = input_data as {
  contact_id?: string | null;
  company_id?: string | null;
  churn_summary?: string;
  subscription_end?: string;
  skipped?: boolean | string;
};

let result;

if (skipped === true || skipped === 'true') {
  result = { skipped: true };
} else if (!contact_id && !company_id) {
  result = { logged: false, message: 'No HubSpot contact or company found. Skipping note.' };
} else {
  // Use contacts.update with a custom property instead of api.get POST to /notes
  // User must create a custom "stripe_churn_notes" text property in HubSpot
  const note_body = `Stripe Subscription Cancelled\n\n${churn_summary}\n\nSubscription ends: ${subscription_end}\n\nLogged automatically by Ballet.`;
  
  const target_id = contact_id || company_id;
  const target_type = contact_id ? 'contacts' : 'companies';
  
  if (target_type === 'contacts') {
    try {
      const updateResult = await metaphor.integration('hubspot', 'contacts.update', {
        contactId: target_id,
        properties: {
          stripe_churn_notes: note_body,
        },
      });

      if (!updateResult.ok) {
        console.warn('Failed to update HubSpot property (ensure stripe_churn_notes exists):', updateResult.error?.message ?? JSON.stringify(updateResult.error));
        result = { logged: false, message: 'HubSpot update failed (property may not exist)' };
      } else {
        result = { logged: true, target_type, target_id };
      }
    } catch (err) {
      console.warn('Failed to update HubSpot property (ensure stripe_churn_notes exists):', err);
      result = { logged: false, message: 'HubSpot update failed (property may not exist)' };
    }
  } else {
    // For companies, we just log that we can't update
    result = { logged: false, message: 'Cannot update company properties via contacts.update. Contact only supported.' };
  }
}
