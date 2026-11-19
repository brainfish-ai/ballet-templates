const { customer_email, customer_name } = input_data as { customer_email: string; customer_name: string };

let contact_id: string | null = null;
let company_id: string | null = null;
let owner_email: string | null = null;
let notes = '';

if (customer_email && customer_email !== 'unknown') {
  // Search for contact by email
  const searchResult = metaphor.integration('hubspot', 'contacts.search', {
    filterGroups: [{
      filters: [{ propertyName: 'email', operator: 'EQ', value: customer_email }]
    }],
    properties: ['firstname', 'lastname', 'email', 'hubspot_owner_id', 'hs_latest_source'],
    limit: 1,
  });

  if (searchResult.ok && searchResult.data?.results?.length > 0) {
    const contactId = searchResult.data.results[0].id;
    
    // Get full contact details with associations
    const contactResult = metaphor.integration('hubspot', 'contacts.get', {
      contactId,
      properties: ['firstname', 'lastname', 'email', 'hubspot_owner_id', 'hs_latest_source'],
      associations: ['companies'],
    });

    if (contactResult.ok) {
      const contact = contactResult.data;
      contact_id = contact.id;
      notes = contact.properties?.hs_latest_source || '';

      // Get owner email if available
      if (contact.properties?.hubspot_owner_id) {
        const ownerResult = metaphor.integration('hubspot', 'api.get', {
          path: `/crm/v3/owners/${contact.properties.hubspot_owner_id}`,
        });
        if (ownerResult.ok) {
          owner_email = ownerResult.data?.email || null;
        }
      }

      // Get associated company
      if (contact.associations?.companies?.results?.length > 0) {
        company_id = contact.associations.companies.results[0].id;
      }
    }
  }
}

const result = {
  contact_id,
  company_id,
  owner_email,
  notes,
  found: !!contact_id,
};
