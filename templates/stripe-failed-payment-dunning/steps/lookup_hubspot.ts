const { customer_email, payment_status, failure_summary } = input_data as {
  customer_email: string;
  payment_status: string;
  failure_summary: string;
};

let contact_id: string | null = null;
let company_id: string | null = null;

if (customer_email && customer_email !== 'unknown') {
  // Search for contact by email
  const searchResult = await metaphor.integration('hubspot', 'contacts.search', {
    filterGroups: [{
      filters: [{ propertyName: 'email', operator: 'EQ', value: customer_email }]
    }],
    properties: ['email', 'hubspot_owner_id'],
    limit: 1,
  });

  if (searchResult.ok && searchResult.data?.results?.length > 0) {
    const contactId = searchResult.data.results[0].id;
    
    // Get full contact details with associations
    const contactResult = await metaphor.integration('hubspot', 'contacts.get', {
      contactId,
      properties: ['email', 'hubspot_owner_id'],
      associations: ['companies'],
    });

    if (contactResult.ok) {
      const contact = contactResult.data;
      contact_id = contact.id;

      // Get associated company
      if (contact.associations?.companies?.results?.length > 0) {
        company_id = contact.associations.companies.results[0].id;
      }
    }
  }
}

if (contact_id) {
  // Update contact payment status (user must create custom 'payment_status' property in HubSpot)
  // Also update a custom property for notes since api.get POST doesn't work
  try {
    const updateResult = await metaphor.integration('hubspot', 'contacts.update', {
      contactId: contact_id,
      properties: {
        payment_status,
        stripe_payment_notes: `Stripe Payment Failure\n\n${failure_summary}\n\nLogged automatically by Ballet.`,
      },
    });

    if (!updateResult.ok) {
      console.warn('Failed to update HubSpot property (ensure stripe_payment_notes exists):', updateResult.error?.message ?? JSON.stringify(updateResult.error));
    }
  } catch (err) {
    console.warn('Failed to update HubSpot property (ensure stripe_payment_notes exists):', err);
  }
}

const result = {
  contact_id,
  company_id,
  updated: !!contact_id,
};
