const { customer_email, customer_name, skipped } = input_data as { customer_email?: string; customer_name?: string; skipped?: boolean | string };

let result;

if (skipped === true || skipped === 'true') {
  result = { skipped: true };
} else {
  let contact_id: string | null = null;
  let company_id: string | null = null;
  let owner_email: string | null = null;
  let latest_source = '';

  if (customer_email && customer_email !== 'unknown') {
  // Search for contact by email
  const searchResult = await metaphor.integration('hubspot', 'contacts.search', {
    filterGroups: [{
      filters: [{ propertyName: 'email', operator: 'EQ', value: customer_email }]
    }],
    properties: ['firstname', 'lastname', 'email', 'hubspot_owner_id', 'hs_latest_source'],
    limit: 1,
  });

  if (searchResult.ok && searchResult.data?.results?.length > 0) {
    const contactId = searchResult.data.results[0].id;
    
    // Get full contact details with associations
    const contactResult = await metaphor.integration('hubspot', 'contacts.get', {
      contactId,
      properties: ['firstname', 'lastname', 'email', 'hubspot_owner_id', 'hs_latest_source'],
      associations: ['companies'],
    });

    if (contactResult.ok) {
      const contact = contactResult.data;
      contact_id = contact.id;
      latest_source = contact.properties?.hs_latest_source || '';

      // Get owner email if available
      if (contact.properties?.hubspot_owner_id) {
        const ownerResult = await metaphor.integration('hubspot', 'api.get', {
          path: `/crm/v3/owners/${contact.properties.hubspot_owner_id}`,
        });
        if (ownerResult.ok) {
          owner_email = ownerResult.data?.data?.email || null;
        }
      }

      // Get associated company
      if (contact.associations?.companies?.results?.length > 0) {
        company_id = contact.associations.companies.results[0].id;
      }
    }
  }
  }

  result = {
    contact_id,
    company_id,
    owner_email,
    latest_source,
    found: !!contact_id,
  };
}
